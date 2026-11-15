
using Microsoft.AspNetCore.Authorization;
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

    public ToursController(PoiDbContext context) => _context = context;

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetTours(
        [FromQuery] bool includeHidden = false)
    {
        var query = _context.Tours.AsNoTracking();

        if (!includeHidden || !User.IsInRole("Admin"))
            query = query.Where(t => t.IsVisible);

        var tours = await query
            .OrderBy(t => t.Name)
            .ToListAsync();

        return Ok(tours);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetTour(Guid id)
    {
        var query = _context.Tours.AsNoTracking()
            .Where(t => t.TourId == id);

        if (!User.IsInRole("Admin"))
            query = query.Where(t => t.IsVisible);

        var tour = await query.FirstOrDefaultAsync();
        return tour is null ? NotFound() : Ok(tour);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/full")]
    public async Task<IActionResult> GetFullTour(Guid id)
    {
        var query = _context.Tours.AsNoTracking()
            .Where(t => t.TourId == id);

        if (!User.IsInRole("Admin"))
            query = query.Where(t => t.IsVisible);

        var tour = await query.FirstOrDefaultAsync();
        if (tour is null) return NotFound("Không tìm thấy tour.");

        var pois = await _context.TourPOIs.AsNoTracking()
            .Where(tp => tp.TourId == id)
            .Join(
                _context.POIs.AsNoTracking().Where(p => p.IsVisible),
                tp => tp.PoiId,
                poi => poi.PoiId,
                (tp, poi) => new
                {
                    poi.PoiId,
                    poi.Name,
                    poi.Address,
                    poi.Description,
                    poi.Latitude,
                    poi.Longitude,
                    tp.DisplayOrder
                })
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync();

        return Ok(new
        {
            tour.TourId,
            tour.Name,
            tour.Description,
            tour.IsVisible,
            pois
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateTour([FromBody] Tour tour)
    {
        tour.TourId = Guid.NewGuid();
        tour.IsVisible = true;
        tour.CreatedAt = DateTime.UtcNow;
        tour.UpdatedAt = null;
        tour.CreatedByAdminId = GetAdminId();

        _context.Tours.Add(tour);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTour),
            new { id = tour.TourId }, tour);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTour(Guid id, [FromBody] Tour input)
    {
        var tour = await _context.Tours.FindAsync(id);
        if (tour is null) return NotFound();

        tour.Name = input.Name;
        tour.Description = input.Description;
        tour.IsVisible = input.IsVisible;
        tour.UpdatedByAdminId = GetAdminId();
        tour.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> HideTour(Guid id)
    {
        var tour = await _context.Tours.FindAsync(id);
        if (tour is null) return NotFound();

        tour.IsVisible = false;
        tour.UpdatedByAdminId = GetAdminId();
        tour.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private Guid? GetAdminId()
    {
        var value = User.FindFirst("admin_id")?.Value
                    ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(value, out var id) ? id : null;
    }
}
