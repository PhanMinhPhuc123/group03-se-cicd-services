
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
        Guid id, [FromBody] UpdateGpsStatusRequest request)
    {
        var status = (request.Status ?? string.Empty).Trim().ToLowerInvariant();
        var allowed = new[] { "not_requested", "granted", "denied", "unavailable", "error" };

        if (!allowed.Contains(status))
            return BadRequest("gpsStatus không hợp lệ.");

        var session = await _context.VisitSessions
            .FirstOrDefaultAsync(s => s.SessionId == id);

        if (session is null) return NotFound("Không tìm thấy phiên tham quan.");
        if (session.EndedAt.HasValue) return BadRequest("Phiên đã kết thúc.");

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
            session.Latitude,
            session.Longitude
        });
    }

    [HttpPost("{id:guid}/heartbeat")]
    public async Task<IActionResult> Heartbeat(Guid id)
    {
        var session = await _context.VisitSessions
            .FirstOrDefaultAsync(s => s.SessionId == id);

        if (session is null) return NotFound();
        if (session.EndedAt.HasValue) return BadRequest("Phiên đã kết thúc.");

        session.LastActiveAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            sessionId = id,
            lastActiveAt = session.LastActiveAt
        });
    }

    [HttpPost("{id:guid}/end")]
    public async Task<IActionResult> End(Guid id)
    {
        var session = await _context.VisitSessions
            .FirstOrDefaultAsync(s => s.SessionId == id);

        if (session is null) return NotFound();

        if (!session.EndedAt.HasValue)
        {
            session.EndedAt = DateTime.UtcNow;
            session.LastActiveAt = session.EndedAt;
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            sessionId = id,
            endedAt = session.EndedAt
        });
    }

 [HttpGet("{id:guid}")]
public async Task<IActionResult> GetSession(Guid id)
{
    var session = await _context.VisitSessions
        .AsNoTracking()
        .FirstOrDefaultAsync(s => s.SessionId == id);

    if (session is null)
        return NotFound("Không tìm thấy phiên tham quan.");

    return Ok(new
    {
        sessionId = session.SessionId,
        startedAt = session.StartedAt,
        lastActiveAt = session.LastActiveAt,
        endedAt = session.EndedAt,
        deviceName = session.DeviceName,
        userAgent = session.UserAgent,

        // Chuyển IPAddress thành string để JSON serialize an toàn
        ipAddress = session.IpAddress?.ToString(),

        uiLanguageCode = session.UiLanguageCode,
        gpsStatus = session.GpsStatus,
        latitude = session.Latitude,
        longitude = session.Longitude,
        gpsConsentAt = session.GpsConsentAt,
        gpsUpdatedAt = session.GpsUpdatedAt
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
        var now = DateTime.UtcNow;
        var activeSince = now.AddMinutes(-30);

        var total = await query.CountAsync();
        var active = await query.CountAsync(s =>
            !s.EndedAt.HasValue && s.LastActiveAt >= activeSince);
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
                IsActive = !s.EndedAt.HasValue && s.LastActiveAt >= activeSince
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
