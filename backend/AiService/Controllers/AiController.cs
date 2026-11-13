using AiService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiService.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class AiController : ControllerBase
{
    private readonly AiDbContext _db;

    public AiController(AiDbContext db) => _db = db;

    [HttpGet("health")]
    public async Task<IActionResult> Health(CancellationToken cancellationToken)
    {
        var databaseReady = await _db.Database.CanConnectAsync(cancellationToken);
        return databaseReady
            ? Ok(new { success = true, service = "AiService", database = "connected" })
            : StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { success = false, service = "AiService", database = "unavailable" });
    }

    [HttpGet("languages")]
    public async Task<IActionResult> GetLanguages(CancellationToken cancellationToken)
    {
        var languages = await _db.Languages.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.LanguageName)
            .Select(x => new
            {
                languageCode = x.LanguageCode,
                languageName = x.LanguageName,
                piperVoice = x.PiperVoice
            })
            .ToListAsync(cancellationToken);

        return Ok(new { success = true, total = languages.Count, data = languages });
    }
}
