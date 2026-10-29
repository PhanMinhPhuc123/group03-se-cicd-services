
using System.IO;
using AiService.Contracts;
using AiService.Data;
using AiService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AiService.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class NarrationController : ControllerBase
{
    private readonly AiDbContext _dbContext;
    private readonly OpenAiNarrationService _narrationService;
    private readonly MinioService _minioService;
    private readonly ILogger<NarrationController> _logger;

    public NarrationController(
        AiDbContext dbContext,
        OpenAiNarrationService narrationService,
        MinioService minioService,
        ILogger<NarrationController> logger)
    {
        _dbContext = dbContext;
        _narrationService = narrationService;
        _minioService = minioService;
        _logger = logger;
    }

    /// <summary>
    /// Generates narration for a POI in the requested language.
    /// </summary>
    [HttpPost("narration")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GenerateNarration(
        [FromBody] GenerateNarrationRequest request,
        CancellationToken cancellationToken)
    {
        if (request.PoiId <= 0 ||
            string.IsNullOrWhiteSpace(request.Language) ||
            request.Language.Length > 50)
        {
            return BadRequest(new
            {
                success = false,
                message = "PoiId must be greater than 0 and Language must not be empty (maximum 50 characters)."
            });
        }

        var poi = await _dbContext.PoiRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.PoiId == request.PoiId && p.IsActive,
                cancellationToken);

        if (poi is null)
        {
            return NotFound(new
            {
                success = false,
                message = $"No active POI was found with ID {request.PoiId}."
            });
        }

        try
        {
            var text = await _narrationService.GenerateNarrationAsync(
                poi.Name,
                poi.Description,
                poi.Location,
                request.Language.Trim(),
                cancellationToken);

            return Ok(new
            {
                success = true,
                poiId = poi.PoiId,
                poiName = poi.Name,
                language = request.Language.Trim(),
                narration = text
            });
        }
        catch (InvalidDataException ex)
        {
            _logger.LogWarning(
                ex,
                "Narration output rejected for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    code = "NARRATION_OUTPUT_INVALID",
                    message = "The AI model returned empty or incorrect-language narration. Please retry."
                });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Unsupported narration request for POI {PoiId}.",
                request.PoiId);

            return BadRequest(new
            {
                success = false,
                code = "INVALID_NARRATION_REQUEST",
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(
                ex,
                "AI narration configuration error for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    success = false,
                    code = "NARRATION_CONFIGURATION_ERROR",
                    message = "AI narration is not configured correctly. Check the AiService configuration."
                });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(
                ex,
                "AI narration provider request failed for POI {PoiId}. HTTP status: {StatusCode}",
                request.PoiId,
                ex.StatusCode);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    code = "NARRATION_PROVIDER_ERROR",
                    message = "The AI provider could not process the narration request. Check AiService logs."
                });
        }
        catch (OperationCanceledException) when (
            cancellationToken.IsCancellationRequested)
        {
            _logger.LogInformation(
                "Narration request cancelled for POI {PoiId}.",
                request.PoiId);

            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected error generating narration for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    success = false,
                    code = "NARRATION_INTERNAL_ERROR",
                    message = "An unexpected error occurred while generating narration."
                });
        }
    }

    /// <summary>
    /// Generates narration, converts it to MP3, stores it in MinIO,
    /// and returns the audio URL.
    /// </summary>
    [HttpPost("narration/audio")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GenerateNarrationAudio(
        [FromBody] GenerateNarrationAudioRequest request,
        CancellationToken cancellationToken)
    {
        if (request.PoiId <= 0 ||
            string.IsNullOrWhiteSpace(request.Language) ||
            request.Language.Length > 50)
        {
            return BadRequest(new
            {
                success = false,
                message = "PoiId must be greater than 0 and Language must not be empty (maximum 50 characters)."
            });
        }

        var poi = await _dbContext.PoiRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.PoiId == request.PoiId && p.IsActive,
                cancellationToken);

        if (poi is null)
        {
            return NotFound(new
            {
                success = false,
                message = $"No active POI was found with ID {request.PoiId}."
            });
        }

        try
        {
            // Step 1: Generate narration text.
            var narration = await _narrationService.GenerateNarrationAsync(
                poi.Name,
                poi.Description,
                poi.Location,
                request.Language.Trim(),
                cancellationToken);

            // Step 2: Convert narration to MP3 audio.
            var audioBytes = await _narrationService.GenerateSpeechAsync(
                narration,
                request.Voice,
                cancellationToken);

            // Step 3: Store the audio in MinIO.
            var objectName = $"{Guid.NewGuid():N}.mp3";

            await _minioService.UploadAudioAsync(
                objectName,
                audioBytes,
                cancellationToken);

            // Step 4: Return the result.
            return Ok(new
            {
                success = true,
                poiId = poi.PoiId,
                poiName = poi.Name,
                language = request.Language.Trim(),
                narration,
                audioContentType = "audio/mpeg",
                audioUrl = $"{Request.Scheme}://{Request.Host}/api/ai/audio/{objectName}"
            });
        }
        catch (InvalidDataException ex)
        {
            _logger.LogWarning(
                ex,
                "Narration output rejected before audio generation for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    code = "NARRATION_OUTPUT_INVALID",
                    message = "The AI model returned empty or incorrect-language narration. Audio was not generated."
                });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "Invalid narration audio request for POI {PoiId}.",
                request.PoiId);

            return BadRequest(new
            {
                success = false,
                code = "INVALID_AUDIO_REQUEST",
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(
                ex,
                "AI/TTS configuration error for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    success = false,
                    code = "AI_TTS_CONFIGURATION_ERROR",
                    message = "AI/TTS is not configured correctly. Check the AiService configuration."
                });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(
                ex,
                "AI/TTS provider request failed for POI {PoiId}. HTTP status: {StatusCode}",
                request.PoiId,
                ex.StatusCode);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    code = "AI_TTS_PROVIDER_ERROR",
                    message = "The AI/TTS provider could not process the request. Check AiService logs."
                });
        }
        catch (OperationCanceledException) when (
            cancellationToken.IsCancellationRequested)
        {
            _logger.LogInformation(
                "Narration audio request cancelled for POI {PoiId}.",
                request.PoiId);

            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Could not create or store narration audio for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    success = false,
                    code = "AUDIO_GENERATION_ERROR",
                    message = "Could not generate or store the audio file. Check AiService logs and MinIO connectivity."
                });
        }
    }

    /// <summary>
    /// Downloads an MP3 audio file stored in MinIO.
    /// </summary>
    [HttpGet("audio/{objectName}")]
    [Produces("audio/mpeg")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAudio(
        string objectName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(objectName) ||
            !objectName.EndsWith(
                ".mp3",
                StringComparison.OrdinalIgnoreCase) ||
            !Guid.TryParseExact(objectName[..^4], "N", out _))
        {
            return BadRequest(new
            {
                success = false,
                message = "Invalid audio file name."
            });
        }

        try
        {
            var bytes = await _minioService.DownloadAudioAsync(
                objectName,
                cancellationToken);

            return File(
                bytes,
                "audio/mpeg",
                enableRangeProcessing: true);
        }
        catch (OperationCanceledException) when (
            cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Audio object {ObjectName} could not be downloaded from MinIO.",
                objectName);

            return NotFound(new
            {
                success = false,
                message = "Audio file was not found or could not be downloaded."
            });
        }
    }
}
