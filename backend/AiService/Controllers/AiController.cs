
using AiService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiService.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController : ControllerBase
{
    private readonly AiDbContext _dbContext;

    public AiController(AiDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // API 1: Kiểm tra AiService có hoạt động hay không.
    // GET /api/ai/health
    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new
        {
            success = true,
            service = "AiService",
            message = "AiService đang hoạt động."
        });
    }

    // API 2: Lấy danh sách POI đã đồng bộ vào PostgreSQL.
    // GET /api/ai/poi
    [HttpGet("poi")]
    public async Task<IActionResult> GetPois()
    {
        var pois = await _dbContext.PoiRecords
            .AsNoTracking()
            .OrderBy(p => p.PoiId)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            total = pois.Count,
            data = pois
        });
    }

    // API 3: Tìm POI theo mã.
    // GET /api/ai/poi/1
    [HttpGet("poi/{id:int}")]
    public async Task<IActionResult> GetPoiById(int id)
    {
        var poi = await _dbContext.PoiRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PoiId == id);

        if (poi == null)
        {
            return NotFound(new
            {
                success = false,
                message = $"Không tìm thấy POI có mã {id}."
            });
        }

        return Ok(new
        {
            success = true,
            data = poi
        });
    }
}
