
namespace PoiService.Models;

public class Tour
{
    public Guid TourId { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsVisible { get; set; } = true;

    public Guid? CreatedByAdminId { get; set; }

    public Guid? UpdatedByAdminId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<TourPOI> TourPOIs { get; set; } = new List<TourPOI>();
}
