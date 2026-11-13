namespace AiService.Models;

public static class NarrationRequestStatuses
{
    public const string Pending = "pending";
    public const string Processing = "processing";
    public const string Success = "success";
    public const string Failed = "failed";
}

/// <summary>Một lần khách yêu cầu tạo/lấy thuyết minh.</summary>
public sealed class NarrationRequest
{
    public Guid RequestId { get; set; } = Guid.NewGuid();
    // Logical references to poi_db.pois and poi_db.visitor_sessions.
    public Guid PoiId { get; set; }
    public Guid SessionId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Status { get; set; } = NarrationRequestStatuses.Pending;
    public Guid IdempotencyKey { get; set; } = Guid.NewGuid();
    public Guid? NarrationContentId { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int RetryCount { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    public Language? Language { get; set; }
    public NarrationContent? NarrationContent { get; set; }
}
