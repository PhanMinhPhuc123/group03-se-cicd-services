
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
    /// Sinh nội dung thuyết minh cho một POI bằng ngôn ngữ được chọn.
    /// </summary>
    [HttpPost("narration")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
                message = "PoiId phải lớn hơn 0 và Language không được để trống (tối đa 50 ký tự)."
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
                message = $"Không tìm thấy POI đang hoạt động có mã {request.PoiId}."
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
                    message = ex.Message
                });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(
                ex,
                "OpenAI narration failed for POI {PoiId}. HTTP status: {StatusCode}",
                request.PoiId,
                ex.StatusCode);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    message = "Nhà cung cấp AI không xử lý được yêu cầu. Kiểm tra log AiService để biết nguyên nhân."
                });
        }
    }

    /// <summary>
    /// Sinh thuyết minh, tạo MP3, lưu vào MinIO và trả về URL phát âm thanh.
    /// </summary>
    [HttpPost("narration/audio")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
                message = "PoiId phải lớn hơn 0 và Language không được để trống (tối đa 50 ký tự)."
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
                message = $"Không tìm thấy POI đang hoạt động có mã {request.PoiId}."
            });
        }

        try
        {
            // Bước 1: Sinh nội dung thuyết minh.
            var narration = await _narrationService.GenerateNarrationAsync(
                poi.Name,
                poi.Description,
                poi.Location,
                request.Language.Trim(),
                cancellationToken);

            // Bước 2: Chuyển nội dung thành giọng nói MP3.
            var audioBytes = await _narrationService.GenerateSpeechAsync(
                narration,
                request.Voice,
                cancellationToken);

            // Bước 3: Tạo tên tệp duy nhất và lưu vào MinIO.
            var objectName = $"{Guid.NewGuid():N}.mp3";

            await _minioService.UploadAudioAsync(
                objectName,
                audioBytes,
                cancellationToken);

            // Bước 4: Trả kết quả cho client.
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
                    message = ex.Message
                });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message
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
                    message = "Nhà cung cấp AI/TTS không xử lý được yêu cầu. Kiểm tra log AiService để biết nguyên nhân."
                });
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
                    message = "Không thể tạo hoặc lưu tệp âm thanh. Kiểm tra log AiService và kết nối MinIO."
                });
        }
    }

    /// <summary>
    /// Phát tệp MP3 đã lưu trong MinIO.
    /// </summary>
    [HttpGet("audio/{objectName}")]
    [Produces("audio/mpeg")]
    public async Task<IActionResult> GetAudio(
        string objectName,
        CancellationToken cancellationToken)
    {
        if (!objectName.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase) ||
            !Guid.TryParseExact(objectName[..^4], "N", out _))
        {
            return BadRequest(new
            {
                success = false,
                message = "Tên tệp âm thanh không hợp lệ."
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
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Audio object {ObjectName} could not be downloaded from MinIO.",
                objectName);

            return NotFound(new
            {
                success = false,
                message = "Không tìm thấy tệp âm thanh."
            });
        }
    }
}
