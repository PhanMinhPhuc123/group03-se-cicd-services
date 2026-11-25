namespace AiService.Models;

/// <summary>Ngôn ngữ được hỗ trợ để sinh nội dung và giọng đọc Piper.</summary>
public sealed class Language
{
    public string LanguageCode { get; set; } = string.Empty;
    public string LanguageName { get; set; } = string.Empty;
    public string PiperVoice { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<NarrationRequest> NarrationRequests { get; set; } = new List<NarrationRequest>();
    public ICollection<NarrationContent> NarrationContents { get; set; } = new List<NarrationContent>();
}
