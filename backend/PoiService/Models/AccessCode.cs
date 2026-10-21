namespace PoiService.Models;

public class AccessCode
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public int TourId { get; set; }

    public DateTime ExpiredAt { get; set; }

    public bool IsActive { get; set; } = true;

    public Tour? Tour { get; set; }
}