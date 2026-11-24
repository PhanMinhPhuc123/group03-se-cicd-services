
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PoiService.Data;
using PoiService.Models;

namespace PoiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VisitSessionsController : ControllerBase
{
    private readonly PoiDbContext _context;

    public VisitSessionsController(PoiDbContext context) => _context = context;

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartSessionRequest? request)
    {
        request ??= new StartSessionRequest();

        var session = new VisitSession
        {
            SessionId = Guid.NewGuid(),
            StartedAt = DateTime.UtcNow,
            DeviceName = Normalize(request.DeviceName, 255),
            UserAgent = Request.Headers.UserAgent.ToString(),
            IpAddress = HttpContext.Connection.RemoteIpAddress,
            UiLanguageCode = Normalize(request.UiLanguageCode, 10),
            GpsStatus = "not_requested"
        };

        _context.VisitSessions.Add(session);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            sessionId = session.SessionId,
            startedAt = session.StartedAt,
            gpsStatus = session.GpsStatus
        });
    }

   
[HttpPut("{id:guid}/gps-status")]
public async Task<IActionResult> UpdateGpsStatus(
    Guid id,
    [FromBody] UpdateGpsStatusRequest? request)
{
    if (request is null)
        return BadRequest("Dữ liệu GPS không hợp lệ.");

    var status = (request.Status ?? string.Empty)
        .Trim()
        .ToLowerInvariant();

    var allowed = new[]
    {
        "not_requested",
        "granted",
        "denied",
        "unavailable",
        "error"
    };

    if (!allowed.Contains(status))
        return BadRequest("gpsStatus không hợp lệ.");

    var session = await _context.VisitSessions
        .FirstOrDefaultAsync(s => s.SessionId == id);

    if (session is null)
        return NotFound("Không tìm thấy phiên tham quan.");

    if (session.EndedAt.HasValue)
        return BadRequest("Phiên đã kết thúc.");

    if (status == "granted")
    {
        if (!ValidCoordinates(request.Latitude, request.Longitude))
            return BadRequest("Trạng thái granted yêu cầu tọa độ hợp lệ.");

        session.Latitude = request.Latitude;
        session.Longitude = request.Longitude;
        session.GpsConsentAt ??= DateTime.UtcNow;
    }
    else
    {
        session.Latitude = null;
        session.Longitude = null;
        session.GpsConsentAt = null;
    }

    session.GpsStatus = status;
    session.GpsUpdatedAt = DateTime.UtcNow;
    session.LastActiveAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        sessionId = session.SessionId,
        gpsStatus = session.GpsStatus,
        latitude = session.Latitude,
        longitude = session.Longitude,
        gpsUpdatedAt = session.GpsUpdatedAt
    });
}

[Microsoft.AspNetCore.Authorization.AllowAnonymous]
[HttpPut("{id:guid}/selected-poi")]
public async Task<IActionResult> UpdateSelectedPoi(
    Guid id,
    [FromBody] UpdateSelectedPoiRequest? request)
{
    if (request is null || request.PoiId == Guid.Empty)
        return BadRequest("Mã POI không hợp lệ.");

    var session = await _context.VisitSessions
        .FirstOrDefaultAsync(s => s.SessionId == id);

    if (session is null)
        return NotFound("Không tìm thấy phiên tham quan.");

    if (session.EndedAt.HasValue)
        return BadRequest("Phiên tham quan đã kết thúc.");

    var poi = await _context.POIs
        .AsNoTracking()
        .Where(p => p.PoiId == request.PoiId && p.IsVisible)
        .Select(p => new
        {
         p.PoiId,
         p.Name,
        p.ImageUrl
        })
        .FirstOrDefaultAsync();

    if (poi is null)
        return NotFound("Không tìm thấy địa điểm hoặc địa điểm không còn hiển thị.");

    session.SelectedPoiName = poi.Name;
session.LastActiveAt = DateTime.UtcNow;

await _context.SaveChangesAsync();

    return Ok(new
    {
        sessionId = session.SessionId,
        poiId = poi.PoiId,
        selectedPoiName = session.SelectedPoiName
    });
}

    
[HttpPost("{id:guid}/heartbeat")]
public async Task<IActionResult> Heartbeat(Guid id)
{
    if (id == Guid.Empty)
        return BadRequest("Mã phiên tham quan không hợp lệ.");

    var session = await _context.VisitSessions
        .FirstOrDefaultAsync(s => s.SessionId == id);

    if (session is null)
        return NotFound("Không tìm thấy phiên tham quan.");

    if (session.EndedAt.HasValue)
        return BadRequest("Phiên đã kết thúc.");

    session.LastActiveAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        sessionId = session.SessionId,
        lastActiveAt = session.LastActiveAt
    });
}


    
[HttpPost("{id:guid}/end")]
public async Task<IActionResult> End(Guid id)
{
    if (id == Guid.Empty)
        return BadRequest("Mã phiên tham quan không hợp lệ.");

    var session = await _context.VisitSessions
        .FirstOrDefaultAsync(s => s.SessionId == id);

    if (session is null)
        return NotFound("Không tìm thấy phiên tham quan.");

    // Nếu phiên chưa kết thúc thì cập nhật thời điểm kết thúc.
    // Nếu đã kết thúc thì giữ nguyên thời điểm cũ.
    if (!session.EndedAt.HasValue)
    {
        var now = DateTime.UtcNow;

        session.EndedAt = now;
        session.LastActiveAt = now;

        await _context.SaveChangesAsync();
    }

    return Ok(new
    {
        sessionId = session.SessionId,
        endedAt = session.EndedAt
    });
}



[HttpGet("{id:guid}")]
public async Task<IActionResult> GetSession(Guid id)
{
    var session = await _context.VisitSessions
        .AsNoTracking()
        .Where(s => s.SessionId == id)
        .Select(s => new
        {
            s.SessionId,
            s.StartedAt,
            s.EndedAt,
            s.SelectedPoiName
        })
        .FirstOrDefaultAsync();

    if (session is null)
        return NotFound("Không tìm thấy phiên tham quan.");

    return Ok(new
    {
        sessionId = session.SessionId,
        startedAt = session.StartedAt,
        endedAt = session.EndedAt,
        selectedPoiName = session.SelectedPoiName
    });
}


    [Microsoft.AspNetCore.Authorization.Authorize(Roles = "Admin")]
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = _context.VisitSessions.AsNoTracking();
        var total = await query.CountAsync();

        var active = await query.CountAsync(s =>
        !s.EndedAt.HasValue);

        var ended = await query.CountAsync(s => s.EndedAt.HasValue);

        var gpsCounts = await query
            .GroupBy(s => s.GpsStatus)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();

        var history = await query
            .OrderByDescending(s => s.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
{
    s.SessionId,
s.StartedAt,
s.LastActiveAt,
s.EndedAt,
s.DeviceName,
s.UiLanguageCode,
s.GpsStatus,
s.Latitude,
s.Longitude,
s.GpsConsentAt,
s.GpsUpdatedAt,
s.SelectedPoiName,
IsActive = !s.EndedAt.HasValue
})
            .ToListAsync();

        return Ok(new
        {
            totalSessions = total,
            activeSessions = active,
            endedSessions = ended,
            gpsCounts,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
            history
        });
    }

    private static bool ValidCoordinates(decimal? latitude, decimal? longitude) =>
        latitude.HasValue && longitude.HasValue &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180;

    private static string? Normalize(string? value, int maxLength)
    {
        var result = value?.Trim();
        if (string.IsNullOrWhiteSpace(result)) return null;
        return result.Length <= maxLength ? result : result[..maxLength];
    }
}

public sealed class StartSessionRequest
{
    public string? DeviceName { get; set; }
    public string? UiLanguageCode { get; set; }
}

public sealed class UpdateGpsStatusRequest
{
    public string Status { get; set; } = "not_requested";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

public sealed class UpdateSelectedPoiRequest
{
    public Guid PoiId { get; set; }
}
