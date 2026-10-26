using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PoiService.Data;
using PoiService.Models;
using PoiService.Messaging;

namespace PoiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class POIsController : ControllerBase
{
    private readonly PoiDbContext _context;
    private readonly RabbitMqPublisher _rabbitMqPublisher;

    public POIsController(
        PoiDbContext context,
        RabbitMqPublisher rabbitMqPublisher)
    {
        _context = context;
        _rabbitMqPublisher = rabbitMqPublisher;
    }

  // GET: api/POIs
// Chỉ lấy các địa điểm đang hoạt động để hiển thị cho khách tham quan.
[HttpGet]
public async Task<ActionResult<IEnumerable<POI>>> GetPOIs()
{
    var pois = await _context.POIs
        .AsNoTracking()
        .Where(p => p.IsActive)
        .OrderBy(p => p.Id)
        .ToListAsync();

    return Ok(pois);
}

    // GET: api/POIs/5
    // Lấy thông tin một POI theo ID
    [HttpGet("{id}")]
    public async Task<ActionResult<POI>> GetPOI(int id)
    {
        var poi = await _context.POIs.FindAsync(id);

        if (poi == null)
        {
            return NotFound();
        }

        return poi;
    }

    // POST: api/POIs
    // Thêm POI mới và phát sự kiện sang RabbitMQ
    [HttpPost]
    public async Task<ActionResult<POI>> CreatePOI(POI poi)
    {
        // 1. Lưu POI vào PostgreSQL
        _context.POIs.Add(poi);
        await _context.SaveChangesAsync();

        // 2. Phát sự kiện POI_CREATED sang RabbitMQ
await _rabbitMqPublisher.PublishAsync(
    "POI_CREATED",
    new
    {
        poiId = poi.Id,
        name = poi.Name,
        description = poi.Description,
        location = poi.Location,
        latitude = poi.Latitude,
        longitude = poi.Longitude,
        isActive = poi.IsActive
    });


        // 3. Trả kết quả về client
        return CreatedAtAction(
            nameof(GetPOI),
            new { id = poi.Id },
            poi);
    }

    // PUT: api/POIs/5
    // Cập nhật thông tin POI và phát sự kiện sang RabbitMQ
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePOI(int id, POI poi)
    {
        if (id != poi.Id)
        {
            return BadRequest();
        }

        _context.Entry(poi).State = EntityState.Modified;

        try
        {
            // 1. Cập nhật PostgreSQL
            await _context.SaveChangesAsync();

            // 2. Phát sự kiện POI_UPDATED sang RabbitMQ
await _rabbitMqPublisher.PublishAsync(
    "POI_UPDATED",
    new
    {
        poiId = poi.Id,
        name = poi.Name,
        description = poi.Description,
        location = poi.Location,
        latitude = poi.Latitude,
        longitude = poi.Longitude,
        isActive = poi.IsActive
    });

        }
        catch (DbUpdateConcurrencyException)
        {
            if (!POIExists(id))
            {
                return NotFound();
            }

            throw;
        }

        return NoContent();
    }

    // DELETE: api/POIs/5
    // Xóa POI và phát sự kiện sang RabbitMQ
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePOI(int id)
    {
        var poi = await _context.POIs.FindAsync(id);

        if (poi == null)
        {
            return NotFound();
        }

        // 1. Xóa POI khỏi PostgreSQL
        _context.POIs.Remove(poi);
        await _context.SaveChangesAsync();
        // 2. Phát sự kiện POI_DELETED sang RabbitMQ  
await _rabbitMqPublisher.PublishAsync(
    "POI_DELETED",
    new
    {
        poiId = poi.Id,
        name = poi.Name,
        latitude = poi.Latitude,
        longitude = poi.Longitude
    });


        return NoContent();
    }

    // GET: api/POIs/nearby?latitude=10.7769&longitude=106.7009&radiusMeters=1000
    [HttpGet("nearby")]
    public async Task<ActionResult<IEnumerable<object>>> GetNearbyPOIs(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radiusMeters = 1000)
    {
        // Kiem tra toa do dau vao
        if (latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180)
        {
            return BadRequest("Latitude phai trong [-90, 90] va longitude trong [-180, 180].");
        }

        // Gioi han ban kinh tim kiem: tren 0 va toi da 100 km
        if (radiusMeters <= 0 || radiusMeters > 100000)
        {
            return BadRequest("radiusMeters phai lon hon 0 va khong vuot qua 100000.");
        }

        // Chi lay POI dang hoat dong va co du toa do GPS
        var pois = await _context.POIs
            .AsNoTracking()
            .Where(p => p.IsActive &&
                        p.Latitude.HasValue &&
                        p.Longitude.HasValue)
            .ToListAsync();

        const double earthRadiusMeters = 6371000;

        var nearbyPOIs = pois
            .Select(p =>
            {
                double poiLatitude = p.Latitude!.Value;
                double poiLongitude = p.Longitude!.Value;

                double dLat = ToRadians(poiLatitude - latitude);
                double dLon = ToRadians(poiLongitude - longitude);

                double a =
                    Math.Pow(Math.Sin(dLat / 2), 2) +
                    Math.Cos(ToRadians(latitude)) *
                    Math.Cos(ToRadians(poiLatitude)) *
                    Math.Pow(Math.Sin(dLon / 2), 2);

                double distance = earthRadiusMeters *
                    2 * Math.Asin(Math.Sqrt(Math.Clamp(a, 0, 1)));

                return new
                {
                    p.Id,
                    p.Name,
                    p.Description,
                    p.Location,
                    Latitude = poiLatitude,
                    Longitude = poiLongitude,
                    DistanceMeters = Math.Round(distance, 2)
                };
            })
            .Where(p => p.DistanceMeters <= radiusMeters)
            .OrderBy(p => p.DistanceMeters)
            .ToList();

        return Ok(nearbyPOIs);
    }

    private static double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }

    private bool POIExists(int id)
    {
        return _context.POIs.Any(e => e.Id == id);
    }
}