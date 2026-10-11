namespace PoiService.Models;

public class POI
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    // Vĩ độ GPS; null nếu chưa có tọa độ xác thực.
    public double? Latitude { get; set; }

    // Kinh độ GPS; null nếu chưa có tọa độ xác thực.
    public double? Longitude { get; set; }

    public bool IsActive { get; set; } = true;
}