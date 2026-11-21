
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PoiService.Models;

/// <summary>
/// Lưu thông tin một phiên khách truy cập trang thuyết minh.
/// </summary>
public class VisitSession
{
    // Mã duy nhất của phiên truy cập.
    public Guid Id { get; set; } = Guid.NewGuid();

    // Địa điểm được xác định từ GPS; có thể chưa xác định lúc bắt đầu.
    public int? POIId { get; set; }

    // Quan hệ đến địa điểm.
    public POI? POI { get; set; }

    // Thời điểm bắt đầu phiên, tính theo UTC.
    public DateTime EntryTime { get; set; } = DateTime.UtcNow;

    // Thời điểm kết thúc; null nghĩa là phiên chưa kết thúc.
    public DateTime? ExitTime { get; set; }

    // Thời điểm hoạt động gần nhất của khách.
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

    // Chỉ lưu tọa độ khi khách đồng ý chia sẻ vị trí.
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public bool LocationConsent { get; set; }

    // Lý do kết thúc phiên: User hoặc Timeout.
    [MaxLength(30)]
    public string? ExitReason { get; set; }

    // Thời lượng tính bằng giây; không lưu thành cột riêng trong DB.
    [NotMapped]
    public long? DurationSeconds =>
        ExitTime.HasValue
            ? Math.Max(
                0,
                (long)(ExitTime.Value - EntryTime).TotalSeconds)
            : null;
}
