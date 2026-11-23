
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Minio;
using Minio.DataModel.Args;
using PoiService.Data;
using PoiService.Models;

namespace PoiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class POIsController : ControllerBase
{
    private readonly PoiDbContext _context;
    private readonly IMinioClient _minioClient;
    private readonly IConfiguration _configuration;

    private const long MaxImageSize = 5 * 1024 * 1024;

    private static readonly Dictionary<string, string> AllowedImages = new()
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp"
    };

    public POIsController(
        PoiDbContext context,
        IMinioClient minioClient,
        IConfiguration configuration)
    {
        _context = context;
        _minioClient = minioClient;
        _configuration = configuration;
    }

    private string ImageBucket =>
        _configuration["Minio:BucketName"] ?? "poi-images";

    // ==========================================
    // 1. GET ALL POIs
    // ==========================================

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<POI>>> GetPOIs(
        [FromQuery] bool includeHidden = false)
    {
        var query = _context.POIs.AsNoTracking();

        if (!includeHidden || !User.IsInRole("Admin"))
            query = query.Where(p => p.IsVisible);

        return Ok(await query.OrderBy(p => p.Name).ToListAsync());
    }

    // ==========================================
    // 2. GET POI BY ID
    // ==========================================

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<POI>> GetPOI(Guid id)
    {
        var query = _context.POIs.AsNoTracking()
            .Where(p => p.PoiId == id);

        if (!User.IsInRole("Admin"))
            query = query.Where(p => p.IsVisible);

        var poi = await query.FirstOrDefaultAsync();

        return poi is null ? NotFound() : Ok(poi);
    }

    // ==========================================
    // 3. GET NEARBY POIs
    // ==========================================

    [AllowAnonymous]
    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearbyPOIs(
        [FromQuery] decimal latitude,
        [FromQuery] decimal longitude,
        [FromQuery] double radiusMeters = 1000)
    {
        if (latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180)
        {
            return BadRequest("Tọa độ không hợp lệ.");
        }

        if (radiusMeters <= 0 || radiusMeters > 100000)
        {
            return BadRequest(
                "Bán kính phải lớn hơn 0 và tối đa 100000 mét.");
        }

        var pois = await _context.POIs.AsNoTracking()
            .Where(p => p.IsVisible &&
                        p.Latitude.HasValue &&
                        p.Longitude.HasValue)
            .ToListAsync();

        const double earthRadius = 6371000;

        var result = pois.Select(p =>
        {
            var lat = (double)p.Latitude!.Value;
            var lng = (double)p.Longitude!.Value;

            var dLat = ToRadians(lat - (double)latitude);
            var dLng = ToRadians(lng - (double)longitude);

            var a =
                Math.Pow(Math.Sin(dLat / 2), 2) +
                Math.Cos(ToRadians((double)latitude)) *
                Math.Cos(ToRadians(lat)) *
                Math.Pow(Math.Sin(dLng / 2), 2);

            var distance = earthRadius *
                2 * Math.Asin(Math.Sqrt(Math.Clamp(a, 0, 1)));

            return new
            {
                p.PoiId,
                p.Name,
                p.Address,
                p.Description,
                p.Latitude,
                p.Longitude,
                ImageUrl = string.IsNullOrWhiteSpace(p.ImageUrl)
                    ? null
                    : $"/api/POIs/{p.PoiId}/image",
                DistanceMeters = Math.Round(distance, 2)
            };
        })
        .Where(p => p.DistanceMeters <= radiusMeters)
        .OrderBy(p => p.DistanceMeters);

        return Ok(result);
    }

    // ==========================================
    // 4. CREATE POI
    // ==========================================

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<POI>> CreatePOI(
        [FromBody] POI poi)
    {
        poi.PoiId = Guid.NewGuid();
        poi.NameSearch = NormalizeSearch(poi.Name);
        poi.AddressSearch = NormalizeSearch(poi.Address);
        poi.IsVisible = true;
        poi.CreatedAt = DateTime.UtcNow;
        poi.UpdatedAt = null;
        poi.CreatedByAdminId = GetAdminId();

        _context.POIs.Add(poi);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetPOI),
            new { id = poi.PoiId },
            poi);
    }

    // ==========================================
    // 5. UPDATE POI
    // ==========================================

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePOI(
        Guid id,
        [FromBody] POI input)
    {
        var poi = await _context.POIs.FindAsync(id);

        if (poi is null)
            return NotFound();

        poi.Name = input.Name;
        poi.NameSearch = NormalizeSearch(input.Name);

        poi.Address = input.Address;
        poi.AddressSearch = NormalizeSearch(input.Address);

        poi.Description = input.Description;
        poi.Latitude = input.Latitude;
        poi.Longitude = input.Longitude;
        poi.IsVisible = input.IsVisible;

        poi.UpdatedByAdminId = GetAdminId();
        poi.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ==========================================
    // 6. HIDE POI
    // ==========================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> HidePOI(Guid id)
    {
        var poi = await _context.POIs.FindAsync(id);

        if (poi is null)
            return NotFound();

        poi.IsVisible = false;
        poi.UpdatedByAdminId = GetAdminId();
        poi.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ==========================================
    // 7. UPLOAD POI IMAGE TO MINIO
    // ==========================================

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/image")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadPOIImage(
        Guid id,
        IFormFile file)
    {
        var poi = await _context.POIs.FindAsync(id);

        if (poi is null)
            return NotFound("Không tìm thấy địa điểm.");

        if (file is null || file.Length == 0)
            return BadRequest("Vui lòng chọn ảnh.");

        if (file.Length > MaxImageSize)
            return BadRequest("Ảnh không được vượt quá 5 MB.");

        var extension = Path.GetExtension(file.FileName)
            .ToLowerInvariant();

        if (!AllowedImages.TryGetValue(extension, out var contentType))
            return BadRequest("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP.");

        if (!string.Equals(
                file.ContentType,
                contentType,
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Định dạng ảnh không hợp lệ.");
        }

        var bucket = ImageBucket;

        // Đảm bảo bucket tồn tại
        var bucketExists = await _minioClient.BucketExistsAsync(
            new BucketExistsArgs().WithBucket(bucket));

        if (!bucketExists)
        {
            await _minioClient.MakeBucketAsync(
                new MakeBucketArgs().WithBucket(bucket));
        }

        // Tạo object key riêng cho ảnh
        var objectName =
            $"{poi.PoiId}/{Guid.NewGuid():N}{extension}";

        var oldObjectName = poi.ImageUrl;

        await using var stream = file.OpenReadStream();

        var uploadArgs = new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectName)
            .WithStreamData(stream)
            .WithObjectSize(file.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(uploadArgs);

        try
        {
            // Lưu object key vào PostgreSQL
            poi.ImageUrl = objectName;
            poi.UpdatedByAdminId = GetAdminId();
            poi.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }
        catch
        {
            // Nếu lưu database thất bại, xóa ảnh vừa upload
            await _minioClient.RemoveObjectAsync(
                new RemoveObjectArgs()
                    .WithBucket(bucket)
                    .WithObject(objectName));

            throw;
        }

        // Xóa ảnh cũ sau khi ảnh mới đã được lưu thành công
        if (!string.IsNullOrWhiteSpace(oldObjectName))
        {
            try
            {
                await _minioClient.RemoveObjectAsync(
                    new RemoveObjectArgs()
                        .WithBucket(bucket)
                        .WithObject(oldObjectName));
            }
            catch
            {
                // Không làm thất bại việc upload ảnh mới
            }
        }

        return Ok(new
        {
            message = "Upload ảnh địa điểm thành công.",
            poiId = poi.PoiId,
            imageUrl = $"/api/POIs/{poi.PoiId}/image"
        });
    }

    // ==========================================
    // 8. GET POI IMAGE FROM MINIO
    // ==========================================

    [AllowAnonymous]
    [HttpGet("{id:guid}/image")]
    public async Task<IActionResult> GetPOIImage(Guid id)
    {
        var poi = await _context.POIs
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PoiId == id);

        if (poi is null)
            return NotFound();

        if (!poi.IsVisible && !User.IsInRole("Admin"))
            return NotFound();

        if (string.IsNullOrWhiteSpace(poi.ImageUrl))
            return NotFound("Địa điểm chưa có ảnh.");

        var extension = Path.GetExtension(poi.ImageUrl)
            .ToLowerInvariant();

        if (!AllowedImages.TryGetValue(extension, out var contentType))
            return NotFound("Định dạng ảnh không hợp lệ.");

        var memoryStream = new MemoryStream();

        try
        {
            var getArgs = new GetObjectArgs()
                .WithBucket(ImageBucket)
                .WithObject(poi.ImageUrl)
                .WithCallbackStream(async (stream, cancellationToken) =>
                {
                    await stream.CopyToAsync(
                        memoryStream,
                        cancellationToken);
                });

            await _minioClient.GetObjectAsync(getArgs);

            memoryStream.Position = 0;

            return File(
                memoryStream,
                contentType,
                enableRangeProcessing: true);
        }
        catch
        {
            memoryStream.Dispose();
            return NotFound("Không tìm thấy ảnh trong MinIO.");
        }
    }

    // ==========================================
    // 9. DELETE POI IMAGE
    // ==========================================

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}/image")]
    public async Task<IActionResult> DeletePOIImage(Guid id)
    {
        var poi = await _context.POIs.FindAsync(id);

        if (poi is null)
            return NotFound("Không tìm thấy địa điểm.");

        if (string.IsNullOrWhiteSpace(poi.ImageUrl))
            return NotFound("Địa điểm chưa có ảnh.");

        var objectName = poi.ImageUrl;

        poi.ImageUrl = null;
        poi.UpdatedByAdminId = GetAdminId();
        poi.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _minioClient.RemoveObjectAsync(
            new RemoveObjectArgs()
                .WithBucket(ImageBucket)
                .WithObject(objectName));

        return Ok(new
        {
            message = "Đã xóa ảnh địa điểm thành công."
        });
    }

    // ==========================================
    // 10. HELPER METHODS
    // ==========================================

    private Guid? GetAdminId()
    {
        var value = User.FindFirst("admin_id")?.Value
                    ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(value, out var id) ? id : null;
    }

    private static string NormalizeSearch(string? value) =>
        (value ?? string.Empty).Trim().ToLowerInvariant();

    private static double ToRadians(double degrees) =>
        degrees * Math.PI / 180.0;
}
