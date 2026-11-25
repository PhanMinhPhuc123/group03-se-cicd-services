using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace AiService.Services;

/// <summary>
/// Response contract của PoiService mới (UUID + isVisible).
/// </summary>
public sealed class PoiApiResponse
{
    public Guid PoiId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameSearch { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string AddressSearch { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsVisible { get; set; }
}

/// <summary>
/// Đọc POI trực tiếp từ PoiService;
/// không lưu bản sao POI trong ai_db.
/// </summary>
public sealed class PoiServiceClient
{
    private readonly HttpClient _httpClient;

    public PoiServiceClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<PoiApiResponse?> GetVisiblePoiAsync(
        Guid poiId,
        CancellationToken cancellationToken)
    {
        if (poiId == Guid.Empty)
        {
            throw new ArgumentException(
                "PoiId không hợp lệ.",
                nameof(poiId));
        }

        using var response = await _httpClient.GetAsync(
            $"api/POIs/{poiId:D}",
            cancellationToken);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        response.EnsureSuccessStatusCode();

        var poi = await response.Content
            .ReadFromJsonAsync<PoiApiResponse>(
                cancellationToken: cancellationToken);

        if (poi is null ||
            poi.PoiId != poiId ||
            string.IsNullOrWhiteSpace(poi.Name) ||
            string.IsNullOrWhiteSpace(poi.Address))
        {
            throw new JsonException(
                "PoiService returned an invalid POI response.");
        }

        return poi.IsVisible ? poi : null;
    }
}