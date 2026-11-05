
using System.Text.Json;

namespace AiService.Messaging;

public sealed class PoiEventMessage
{
    public string? EventName { get; set; }

    public DateTime OccurredAt { get; set; }

    public JsonElement Data { get; set; }
}

public sealed class PoiEventData
{
    public int PoiId { get; set; }

    public string? Name { get; set; }

    public string? Description { get; set; }

    public string? Location { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public bool? IsActive { get; set; }
}
