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

    public TourPOIsController(PoiDbContext context)
    {
        _context = context;
    }

    // GET: api/TourPOIs
    // Lấy danh sách tất cả POI được gán vào các Tour
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TourPOI>>> GetTourPOIs()
    {
        return await _context.TourPOIs
            .ToListAsync();
    }

    // GET: api/TourPOIs/1/1
    // Lấy một POI cụ thể trong một Tour
    [HttpGet("{tourId}/{poiId}")]
    public async Task<ActionResult<TourPOI>> GetTourPOI(
        int tourId,
        int poiId)
    {
        var tourPOI = await _context.TourPOIs
            .FirstOrDefaultAsync(tp =>
                tp.TourId == tourId &&
                tp.POIId == poiId);

        if (tourPOI == null)
        {
            return NotFound();
        }

        return tourPOI;
    }

    // POST: api/TourPOIs
    // Gán một POI vào một Tour
    [HttpPost]
    public async Task<ActionResult<TourPOI>> CreateTourPOI(TourPOI tourPOI)
    {
        var tourExists = await _context.Tours
            .AnyAsync(t => t.Id == tourPOI.TourId);

        if (!tourExists)
        {
            return BadRequest("Tour không tồn tại.");
        }

        var poiExists = await _context.POIs
            .AnyAsync(p => p.Id == tourPOI.POIId);

        if (!poiExists)
        {
            return BadRequest("POI không tồn tại.");
        }

        var exists = await _context.TourPOIs
            .AnyAsync(tp =>
                tp.TourId == tourPOI.TourId &&
                tp.POIId == tourPOI.POIId);

        if (exists)
        {
            return Conflict("POI này đã được gán vào Tour.");
        }

        _context.TourPOIs.Add(tourPOI);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetTourPOI),
            new
            {
                tourId = tourPOI.TourId,
                poiId = tourPOI.POIId
            },
            tourPOI);
    }

    // PUT: api/TourPOIs/1/1
    // Cập nhật thứ tự hiển thị của POI trong Tour
    [HttpPut("{tourId}/{poiId}")]
    public async Task<IActionResult> UpdateTourPOI(
        int tourId,
        int poiId,
        TourPOI tourPOI)
    {
        if (tourId != tourPOI.TourId ||
            poiId != tourPOI.POIId)
        {
            return BadRequest();
        }

        var exists = await _context.TourPOIs
            .AnyAsync(tp =>
                tp.TourId == tourId &&
                tp.POIId == poiId);

        if (!exists)
        {
            return NotFound();
        }

        _context.Entry(tourPOI).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/TourPOIs/1/1
    // Xóa POI khỏi Tour
    [HttpDelete("{tourId}/{poiId}")]
    public async Task<IActionResult> DeleteTourPOI(
        int tourId,
        int poiId)
    {
        var tourPOI = await _context.TourPOIs
            .FirstOrDefaultAsync(tp =>
                tp.TourId == tourId &&
                tp.POIId == poiId);

        if (tourPOI == null)
        {
            return NotFound();
        }

        _context.TourPOIs.Remove(tourPOI);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}