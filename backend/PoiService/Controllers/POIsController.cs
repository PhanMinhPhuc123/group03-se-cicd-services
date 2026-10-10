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
    // Lấy danh sách tất cả POI
    [HttpGet]
    public async Task<ActionResult<IEnumerable<POI>>> GetPOIs()
    {
        return await _context.POIs.ToListAsync();
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
                name = poi.Name
            });

        return NoContent();
    }

    private bool POIExists(int id)
    {
        return _context.POIs.Any(e => e.Id == id);
    }
}