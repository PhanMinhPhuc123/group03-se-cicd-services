namespace AiService.Contracts;

public sealed class GenerateNarrationRequest
{
    public int PoiId { get; set; }
    public string Language { get; set; } = "Vietnamese";
}

public sealed class GenerateNarrationAudioRequest
{
    public int PoiId { get; set; }
    public string Language { get; set; } = "Vietnamese";
    public string? Voice { get; set; }
}
