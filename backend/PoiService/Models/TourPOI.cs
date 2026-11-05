namespace PoiService.Models;

public class TourPOI
{
    public int TourId { get; set; }

    public int POIId { get; set; }

    public int DisplayOrder { get; set; }

   public Tour? Tour { get; set; }

public POI? POI { get; set; }
}