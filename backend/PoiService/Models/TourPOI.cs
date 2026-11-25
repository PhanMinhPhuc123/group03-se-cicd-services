
namespace PoiService.Models;

public class TourPOI
{
    public Guid TourId { get; set; }

    public Guid PoiId { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public Tour? Tour { get; set; }

    public POI? POI { get; set; }
}
