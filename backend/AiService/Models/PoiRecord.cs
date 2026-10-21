
namespace AiService.Models;

public class PoiRecord
{
    // Ma POI duoc dong bo tu PoiService
    public int PoiId { get; set; }

    // Thong tin dia diem
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    // Toa do co the khong co
    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    // Trang thai hoat dong
    public bool IsActive { get; set; } = true;
}
