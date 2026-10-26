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

    public VisitSessionsController(PoiDbContext context)
    {
        _context = context;
    }

    // Bắt đầu phiên tham quan. GPS là tùy chọn; nếu có GPS thì tìm POI gần nhất trong bán kính 1 km.
    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartSessionRequest request)
    {
        if (request.LocationConsent &&
            (!request.Latitude.HasValue || !request.Longitude.HasValue ||
             request.Latitude < -90 || request.Latitude > 90 ||
             request.Longitude < -180 || request.Longitude > 180))
        {
            return BadRequest(new { message = "Tọa độ GPS không hợp lệ." });
        }

        POI? nearestPoi = null;
        if (request.LocationConsent)
        {
            var candidates = await _context.POIs
                .Where(p => p.IsActive && p.Latitude.HasValue && p.Longitude.HasValue)
                .ToListAsync();

            nearestPoi = candidates
                .Select(p => new
                {
                    Poi = p,
                    Distance = DistanceMeters(
                        request.Latitude!.Value,
                        request.Longitude!.Value,
                        p.Latitude!.Value,
                        p.Longitude!.Value)
                })
                .Where(x => x.Distance <= 1000)
                .OrderBy(x => x.Distance)
                .Select(x => x.Poi)
                .FirstOrDefault();
        }

        var session = new VisitSession
        {
            Id = Guid.NewGuid(),
            POIId = nearestPoi?.Id,
           EntryTime = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            Latitude = request.LocationConsent ? request.Latitude : null,
            Longitude = request.LocationConsent ? request.Longitude : null,
            LocationConsent = request.LocationConsent,
            ExitTime = null,
            ExitReason = null
        };

        _context.VisitSessions.Add(session);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = session.Id,
            sessionId = session.Id,
            poiId = session.POIId,
            poiName = nearestPoi?.Name,
            entryTime = session.EntryTime,
            locationConsent = session.LocationConsent,
            message = nearestPoi == null && request.LocationConsent
                ? "Đã tạo phiên nhưng chưa tìm thấy POI trong bán kính 1 km."
                : "Đã tạo phiên tham quan."
        });
    }

    // Cập nhật vị trí trong phiên đang diễn ra.
    [HttpPut("{id:guid}/location")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationRequest request)
    {
        var session = await _context.VisitSessions.FirstOrDefaultAsync(x => x.Id == id);
        if (session == null) return NotFound(new { message = "Không tìm thấy phiên tham quan." });
        if (session.ExitTime.HasValue) return BadRequest(new { message = "Phiên tham quan đã kết thúc." });

        session.LocationConsent = request.LocationConsent;
        if (!request.LocationConsent)
        {
            session.Latitude = null;
            session.Longitude = null;
            session.POIId = null;
        }
        else
        {
            if (!request.Latitude.HasValue || !request.Longitude.HasValue ||
                request.Latitude < -90 || request.Latitude > 90 ||
                request.Longitude < -180 || request.Longitude > 180)
            {
                return BadRequest(new { message = "Tọa độ GPS không hợp lệ." });
            }

            session.Latitude = request.Latitude;
            session.Longitude = request.Longitude;
            session.LastActivityAt = DateTime.UtcNow;
            var candidates = await _context.POIs
                .Where(p => p.IsActive && p.Latitude.HasValue && p.Longitude.HasValue)
                .ToListAsync();

            session.POIId = candidates
                .Select(p => new
                {
                    Poi = p,
                    Distance = DistanceMeters(request.Latitude.Value, request.Longitude.Value,
                        p.Latitude!.Value, p.Longitude!.Value)
                })
                .Where(x => x.Distance <= 1000)
                .OrderBy(x => x.Distance)
                .Select(x => (int?)x.Poi.Id)
                .FirstOrDefault();
        }

        await _context.SaveChangesAsync();
        return Ok(new { sessionId = session.Id, poiId = session.POIId, message = "Đã cập nhật phiên tham quan." });
    }
// Ghi nhận khách vẫn đang sử dụng trang tham quan.
[HttpPost("{id:guid}/heartbeat")]
public async Task<IActionResult> Heartbeat(Guid id)
{
    var session = await _context.VisitSessions
        .FirstOrDefaultAsync(x => x.Id == id);

    if (session == null)
    {
        return NotFound(new { message = "Không tìm thấy phiên tham quan." });
    }

    if (session.ExitTime.HasValue)
    {
        return BadRequest(new { message = "Phiên tham quan đã kết thúc." });
    }

    session.LastActivityAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        sessionId = session.Id,
        lastActivityAt = session.LastActivityAt,
        message = "Đã cập nhật hoạt động."
    });
}
    // Kết thúc phiên và lưu thời điểm rời đi.
    [HttpPost("{id:guid}/end")]
    public async Task<IActionResult> End(Guid id, [FromBody] EndSessionRequest? request)
    {
        var session = await _context.VisitSessions.FirstOrDefaultAsync(x => x.Id == id);
        if (session == null) return NotFound(new { message = "Không tìm thấy phiên tham quan." });
        if (!session.ExitTime.HasValue)
        {
            session.ExitTime = DateTime.UtcNow;
            session.ExitReason = string.Equals(request?.Reason, "Timeout", StringComparison.OrdinalIgnoreCase)
                ? "Timeout"
                : "User";
            await _context.SaveChangesAsync();
        }

        var durationSeconds = Math.Max(0, (session.ExitTime.Value - session.EntryTime).TotalSeconds);
        return Ok(new
        {
            sessionId = session.Id,
            exitTime = session.ExitTime,
            durationSeconds = Math.Round(durationSeconds),
            message = "Đã kết thúc phiên tham quan."
        });
    }

    // API lấy thống kê tổng quan và lịch sử tham quan.
   
[HttpGet("stats")]
public async Task<IActionResult> GetStats()
{
    // Bước 1: Xác định thời điểm giới hạn hoạt động.
    // Phiên không có hoạt động trong hơn 5 phút sẽ được kết thúc.
    var timeout = DateTime.UtcNow.AddMinutes(-5);

    // Bước 2: Tìm các phiên chưa kết thúc và đã quá thời gian chờ.
    var expiredSessions = await _context.VisitSessions
        .Where(s => !s.ExitTime.HasValue
                 && s.LastActivityAt < timeout)
        .ToListAsync();

    // Bước 3: Đánh dấu các phiên quá hạn là đã kết thúc.
    foreach (var session in expiredSessions)
    {
        // Thời điểm kết thúc được tính từ lần hoạt động cuối cùng.
        session.ExitTime = session.LastActivityAt.AddMinutes(5);

        // Ghi nhận lý do kết thúc do hết thời gian hoạt động.
        session.ExitReason = "Timeout";
    }

    // Bước 4: Lưu các thay đổi vào database nếu có phiên quá hạn.
    if (expiredSessions.Count > 0)
    {
        await _context.SaveChangesAsync();
    }

    // Bước 5: Lấy danh sách phiên mới nhất, kèm thông tin địa điểm.
    var sessions = await _context.VisitSessions
        .AsNoTracking()
        .Include(s => s.POI)
        .OrderByDescending(s => s.EntryTime)
        .ToListAsync();

    // Bước 6: Lọc các phiên đã kết thúc.
    var completedSessions = sessions
        .Where(s => s.ExitTime.HasValue)
        .ToList();

    // Bước 7: Tính thời lượng trung bình của các phiên đã kết thúc.
    var averageDurationSeconds = completedSessions.Count > 0
        ? completedSessions.Average(s =>
            Math.Max(0, (s.ExitTime!.Value - s.EntryTime).TotalSeconds))
        : 0;

    // Bước 8: Lấy tối đa 100 phiên gần nhất để hiển thị lịch sử.
    var history = sessions.Take(100).Select(s => new
    {
        sessionId = s.Id,
        poiId = s.POIId,
        poiName = s.POI != null
            ? s.POI.Name
            : "Chưa xác định địa điểm",
        entryTime = s.EntryTime,
        exitTime = s.ExitTime,

        // Phiên đang mở chưa có thời lượng kết thúc.
        durationSeconds = s.ExitTime.HasValue
            ? (long?)Math.Max(
                0, (s.ExitTime.Value - s.EntryTime).TotalSeconds)
            : null,

        isActive = !s.ExitTime.HasValue,
        locationConsent = s.LocationConsent,
        exitReason = s.ExitReason
    }).ToList();

    // Bước 9: Trả thống kê tổng quan và lịch sử về frontend.
    return Ok(new
    {
        totalVisits = sessions.Count,
        activeVisits = sessions.Count(s => !s.ExitTime.HasValue),
        completedVisits = completedSessions.Count,
        averageDurationSeconds = Math.Round(averageDurationSeconds),
        history
    });
}

    private static double DistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadius = 6371000;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Pow(Math.Sin(dLat / 2), 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Pow(Math.Sin(dLon / 2), 2);
        return earthRadius * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}

public class StartSessionRequest
{
    public bool LocationConsent { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class UpdateLocationRequest
{
    public bool LocationConsent { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class EndSessionRequest
{
    public string? Reason { get; set; }
}
