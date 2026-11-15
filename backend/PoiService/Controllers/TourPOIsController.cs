
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PoiService.Data;
using PoiService.Models;

namespace PoiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TourPOIsController : ControllerBase
{
    private readonly PoiDbContext _context;

    public TourPOIsController(PoiDbContext context) => _context = context;


    [AllowAnonymous]
    [HttpGet("{tourId:guid}")]
    public async Task<IActionResult> GetTourPOIs(Guid tourId)
    {
        var isAdmin = User.IsInRole("Admin");

        var tourExists = await _context.Tours.AsNoTracking()
            .AnyAsync(t => t.TourId == tourId &&
                           (isAdmin || t.IsVisible));

        if (!tourExists)
            return NotFound();

        var items = await _context.TourPOIs.AsNoTracking()
            .Where(tp => tp.TourId == tourId &&
                         (isAdmin || _context.POIs.Any(p =>
                             p.PoiId == tp.PoiId && p.IsVisible)))
            .OrderBy(tp => tp.DisplayOrder)
            .ToListAsync();

        return Ok(items);
    }

    [AllowAnonymous]
    [HttpGet("{tourId:guid}/{poiId:guid}")]
    public async Task<IActionResult> GetTourPOI(Guid tourId, Guid poiId)
    {
        var isAdmin = User.IsInRole("Admin");

        var tourExists = await _context.Tours.AsNoTracking()
            .AnyAsync(t => t.TourId == tourId &&
                           (isAdmin || t.IsVisible));

        if (!tourExists)
            return NotFound();

        var item = await _context.TourPOIs.AsNoTracking()
            .FirstOrDefaultAsync(tp =>
                tp.TourId == tourId &&
                tp.PoiId == poiId &&
                (isAdmin || _context.POIs.Any(p =>
                    p.PoiId == tp.PoiId && p.IsVisible)));

        return item is null ? NotFound() : Ok(item);
    }


    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> AddPOIToTour([FromBody] TourPOI item)
    {
        var tourExists = await _context.Tours
            .AnyAsync(t => t.TourId == item.TourId);

        if (!tourExists) return BadRequest("Tour không tồn tại.");

        var poiExists = await _context.POIs
            .AnyAsync(p => p.PoiId == item.PoiId);

        if (!poiExists) return BadRequest("POI không tồn tại.");

        var exists = await _context.TourPOIs.AnyAsync(tp =>
            tp.TourId == item.TourId && tp.PoiId == item.PoiId);

        if (exists) return Conflict("POI đã nằm trong tour.");

        item.AddedAt = DateTime.UtcNow;
        _context.TourPOIs.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTourPOI),
            new { tourId = item.TourId, poiId = item.PoiId }, item);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{tourId:guid}/{poiId:guid}")]
    public async Task<IActionResult> UpdateTourPOI(
        Guid tourId, Guid poiId, [FromBody] UpdateTourPOIRequest request)
    {
        var item = await _context.TourPOIs.FirstOrDefaultAsync(tp =>
            tp.TourId == tourId && tp.PoiId == poiId);

        if (item is null) return NotFound();

        item.DisplayOrder = request.DisplayOrder;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{tourId:guid}/{poiId:guid}")]
    public async Task<IActionResult> RemovePOIFromTour(Guid tourId, Guid poiId)
    {
        var item = await _context.TourPOIs.FirstOrDefaultAsync(tp =>
            tp.TourId == tourId && tp.PoiId == poiId);

        if (item is null) return NotFound();

        _context.TourPOIs.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public sealed class UpdateTourPOIRequest
{
    public int DisplayOrder { get; set; }
}
