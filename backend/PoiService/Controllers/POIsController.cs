
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PoiService.Data;
using PoiService.Models;

namespace PoiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class POIsController : ControllerBase
{
    private readonly PoiDbContext _context;

    public POIsController(PoiDbContext context) => _context = context;

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

    [AllowAnonymous]
    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearbyPOIs(
        [FromQuery] decimal latitude,
        [FromQuery] decimal longitude,
        [FromQuery] double radiusMeters = 1000)
    {
        if (latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180)
            return BadRequest("Tọa độ không hợp lệ.");

        if (radiusMeters <= 0 || radiusMeters > 100000)
            return BadRequest("Bán kính phải lớn hơn 0 và tối đa 100000 mét.");

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

            var a = Math.Pow(Math.Sin(dLat / 2), 2) +
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
                DistanceMeters = Math.Round(distance, 2)
            };
        })
        .Where(p => p.DistanceMeters <= radiusMeters)
        .OrderBy(p => p.DistanceMeters);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<POI>> CreatePOI([FromBody] POI poi)
    {
        var errors = ValidatePOI(poi);
        if (errors.Count > 0)
            return BadRequest(new { errors });

        poi.Name = poi.Name.Trim();
        poi.Address = poi.Address.Trim();

        poi.PoiId = Guid.NewGuid();
        poi.NameSearch = NormalizeSearch(poi.Name);
        poi.AddressSearch = NormalizeSearch(poi.Address);
        poi.IsVisible = true;
        poi.CreatedAt = DateTime.UtcNow;
        poi.UpdatedAt = null;
        poi.CreatedByAdminId = GetAdminId();

        _context.POIs.Add(poi);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPOI),
            new { id = poi.PoiId }, poi);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePOI(Guid id, [FromBody] POI input)
    {
        var poi = await _context.POIs.FindAsync(id);
        if (poi is null)
            return NotFound();

        var errors = ValidatePOI(input);
        if (errors.Count > 0)
            return BadRequest(new { errors });

        input.Name = input.Name.Trim();
        input.Address = input.Address.Trim();

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

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> HidePOI(Guid id)
    {
        var poi = await _context.POIs.FindAsync(id);
        if (poi is null) return NotFound();

        poi.IsVisible = false;
        poi.UpdatedByAdminId = GetAdminId();
        poi.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static List<string> ValidatePOI(POI poi)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(poi.Name))
            errors.Add("Tên địa điểm không được để trống.");
        else if (poi.Name.Trim().Length > 255)
            errors.Add("Tên địa điểm không được vượt quá 255 ký tự.");

        if (string.IsNullOrWhiteSpace(poi.Address))
            errors.Add("Địa chỉ không được để trống.");
        else if (poi.Address.Trim().Length > 500)
            errors.Add("Địa chỉ không được vượt quá 500 ký tự.");

        if (poi.Latitude.HasValue != poi.Longitude.HasValue)
            errors.Add("Vĩ độ và kinh độ phải được cung cấp đồng thời.");

        if (poi.Latitude.HasValue &&
            (poi.Latitude.Value < -90 || poi.Latitude.Value > 90))
            errors.Add("Vĩ độ phải nằm trong khoảng từ -90 đến 90.");

        if (poi.Longitude.HasValue &&
            (poi.Longitude.Value < -180 || poi.Longitude.Value > 180))
            errors.Add("Kinh độ phải nằm trong khoảng từ -180 đến 180.");

        return errors;
    }

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
