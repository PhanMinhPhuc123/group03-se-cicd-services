namespace AiService.Models;

/// <summary>
/// Metadata của audio; dữ liệu nhị phân được lưu trong MinIO.
/// </summary>
public sealed class AudioFile
{
    public Guid AudioId { get; set; } = Guid.NewGuid();

    public Guid ContentId { get; set; }

    public string BucketName { get; set; } = string.Empty;

    public string ObjectKey { get; set; } = string.Empty;

    public string ContentType { get; set; } = "audio/mpeg";

    public decimal? DurationSeconds { get; set; }

    public long? SizeBytes { get; set; }

    public string TtsVoice { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public NarrationContent? NarrationContent { get; set; }
}