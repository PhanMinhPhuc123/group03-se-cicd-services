namespace AiService.Contracts;

/// <summary>
/// Request thuyết minh theo thiết kế mới.
/// IdempotencyKey nên được client giữ nguyên khi retry cùng một yêu cầu.
/// </summary>
public sealed class GenerateNarrationRequest
{
    public Guid PoiId { get; set; }
    public Guid SessionId { get; set; }
    public string LanguageCode { get; set; } = "vi-VN";
    public Guid? IdempotencyKey { get; set; }
}
