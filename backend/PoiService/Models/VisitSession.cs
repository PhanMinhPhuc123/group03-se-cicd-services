
namespace PoiService.Models;

public class VisitSession
{
    public Guid SessionId { get; set; } = Guid.NewGuid();

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastActiveAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public string? DeviceName { get; set; }

    public string? UserAgent { get; set; }

    public System.Net.IPAddress? IpAddress { get; set; }

    public string? UiLanguageCode { get; set; }

    public string GpsStatus { get; set; } = "not_requested";

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public DateTime? GpsConsentAt { get; set; }

    public DateTime? GpsUpdatedAt { get; set; }

    public string? SelectedPoiName { get; set; }
}
