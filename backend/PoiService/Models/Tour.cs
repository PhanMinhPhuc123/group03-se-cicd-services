namespace PoiService.Models;

public class Tour
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public ICollection<AccessCode> AccessCodes { get; set; } = new List<AccessCode>();
}