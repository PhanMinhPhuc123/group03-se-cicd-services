
namespace PoiService.Models;

public class POI
{
    public Guid PoiId { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string NameSearch { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string AddressSearch { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool IsVisible { get; set; } = true;

    public Guid? CreatedByAdminId { get; set; }

    public Guid? UpdatedByAdminId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
