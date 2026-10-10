using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PoiService.Data;
using PoiService.Models;

namespace PoiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ToursController : ControllerBase
{
    private readonly PoiDbContext _context;

    public ToursController(PoiDbContext context)
    {
        _context = context;
    }

    // GET: api/Tours
    // Lấy danh sách tất cả tour
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Tour>>> GetTours()
    {
        return await _context.Tours
            .ToListAsync();
    }

    // GET: api/Tours/5
    // Lấy thông tin một tour theo ID
    [HttpGet("{id}")]
    public async Task<ActionResult<Tour>> GetTour(int id)
    {
        var tour = await _context.Tours
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tour == null)
        {
            return NotFound();
        }

        return tour;
    }

    // POST: api/Tours
    // Thêm một tour mới
    [HttpPost]
    public async Task<ActionResult<Tour>> CreateTour(Tour tour)
    {
        _context.Tours.Add(tour);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetTour),
            new { id = tour.Id },
            tour);
    }

    // PUT: api/Tours/5
    // Cập nhật thông tin tour
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTour(int id, Tour tour)
    {
        if (id != tour.Id)
        {
            return BadRequest();
        }

        _context.Entry(tour).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TourExists(id))
            {
                return NotFound();
            }

            throw;
        }

        return NoContent();
    }

    // DELETE: api/Tours/5
    // Xóa tour
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTour(int id)
    {
        var tour = await _context.Tours.FindAsync(id);

        if (tour == null)
        {
            return NotFound();
        }

        _context.Tours.Remove(tour);
        await _context.SaveChangesAsync();

        return NoContent();
    }

// GET: api/Tours/1/full
// Lấy toàn bộ thông tin Tour và danh sách POI thuộc Tour
[HttpGet("{id}/full")]
public async Task<IActionResult> GetFullTour(int id)
{
    var tour = await _context.Tours
        .FirstOrDefaultAsync(t => t.Id == id);

    if (tour == null)
    {
        return NotFound("Tour không tồn tại.");
    }

    var pois = await _context.TourPOIs
        .Where(tp => tp.TourId == id)
        .Join(
            _context.POIs,
            tp => tp.POIId,
            poi => poi.Id,
            (tp, poi) => new
            {
                poiId = poi.Id,
                name = poi.Name,
                description = poi.Description,
                location = poi.Location,
                isActive = poi.IsActive,
                displayOrder = tp.DisplayOrder
            })
        .OrderBy(x => x.displayOrder)
        .ToListAsync();

    return Ok(new
    {
        tourId = tour.Id,
        tourName = tour.Name,
        description = tour.Description,
        isActive = tour.IsActive,
        pois = pois
    });
}

    private bool TourExists(int id)
    {
        return _context.Tours.Any(e => e.Id == id);
    }
}