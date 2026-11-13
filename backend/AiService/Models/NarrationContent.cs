namespace AiService.Models;

/// <summary>Nội dung thuyết minh đã sinh cho một POI và một ngôn ngữ.</summary>
public sealed class NarrationContent
{
    public Guid ContentId { get; set; } = Guid.NewGuid();
    // Logical reference to poi_db.pois; deliberately no cross-database navigation/FK.
    public Guid PoiId { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string SourceHash { get; set; } = string.Empty;
    public string GeneratedText { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public string PromptVersion { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public Language? Language { get; set; }
    public AudioFile? AudioFile { get; set; }
    public ICollection<NarrationRequest> NarrationRequests { get; set; } = new List<NarrationRequest>();
}
