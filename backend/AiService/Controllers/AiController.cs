
using System.Net;
using AiService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiService.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class AiController : ControllerBase
{
    private readonly AiDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AiController> _logger;

    public AiController(
        AiDbContext db,
        IHttpClientFactory httpClientFactory,
        ILogger<AiController> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Checks whether AiService and its required dependencies are ready.
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Health(CancellationToken cancellationToken)
    {
        var databaseTask = CheckDatabaseAsync(cancellationToken);

        var minioTask = CheckHttpDependencyAsync(
            "MinioHealth",
            "minio/health/ready",
            cancellationToken);

        var ollamaTask = CheckHttpDependencyAsync(
            "OllamaHealth",
            "models",
            cancellationToken);

        var piperTask = CheckHttpDependencyAsync(
            "PiperHealth",
            "audio/models",
            cancellationToken);

        var poiServiceTask = CheckHttpDependencyAsync(
            "PoiServiceHealth",
            $"api/POIs/{Guid.NewGuid():D}",
            cancellationToken,
            acceptNotFound: true);

        await Task.WhenAll(
            databaseTask,
            minioTask,
            ollamaTask,
            piperTask,
            poiServiceTask);

        var dependencies = new
        {
            database = databaseTask.Result ? "ready" : "unavailable",
            minio = minioTask.Result ? "ready" : "unavailable",
            ollama = ollamaTask.Result ? "ready" : "unavailable",
            piper = piperTask.Result ? "ready" : "unavailable",
            poiService = poiServiceTask.Result ? "ready" : "unavailable"
        };

        var ready =
            databaseTask.Result &&
            minioTask.Result &&
            ollamaTask.Result &&
            piperTask.Result &&
            poiServiceTask.Result;

        var response = new
        {
            success = ready,
            service = "AiService",
            process = "running",
            status = ready ? "ready" : "degraded",
            timestamp = DateTime.UtcNow,
            dependencies
        };

        return ready
            ? Ok(response)
            : StatusCode(StatusCodes.Status503ServiceUnavailable, response);
    }

    /// <summary>
    /// Returns all active narration languages.
    /// </summary>
    [HttpGet("languages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GetLanguages(
        CancellationToken cancellationToken)
    {
        try
        {
            var languages = await _db.Languages
                .AsNoTracking()
                .Where(x => x.IsActive)
                .OrderBy(x => x.LanguageName)
                .Select(x => new
                {
                    languageCode = x.LanguageCode,
                    languageName = x.LanguageName,
                    piperVoice = x.PiperVoice
                })
                .ToListAsync(cancellationToken);

            return Ok(new
            {
                success = true,
                total = languages.Count,
                data = languages
            });
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve narration languages.");

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    success = false,
                    code = "LANGUAGES_UNAVAILABLE",
                    message = "Danh sách ngôn ngữ hiện không khả dụng."
                });
        }
    }

    private async Task<bool> CheckDatabaseAsync(
        CancellationToken cancellationToken)
    {
        try
        {
            return await _db.Database.CanConnectAsync(cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "PostgreSQL health check failed.");
            return false;
        }
    }

    private async Task<bool> CheckHttpDependencyAsync(
        string clientName,
        string path,
        CancellationToken cancellationToken,
        bool acceptNotFound = false)
    {
        try
        {
            var client = _httpClientFactory.CreateClient(clientName);

            using var response = await client.GetAsync(
                path,
                cancellationToken);

            return response.IsSuccessStatusCode ||
                   (acceptNotFound &&
                    response.StatusCode == HttpStatusCode.NotFound);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Health check failed for dependency {Dependency}.",
                clientName);

            return false;
        }
    }
}
