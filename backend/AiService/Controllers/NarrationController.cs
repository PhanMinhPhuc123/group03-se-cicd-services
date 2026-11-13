using System.Security.Cryptography;
using System.Text;
using AiService.Contracts;
using AiService.Data;
using AiService.Models;
using AiService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AiService.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class NarrationController : ControllerBase
{
    private const string PromptVersion = "v1";

    private readonly AiDbContext _db;
    private readonly PoiServiceClient _poiClient;
    private readonly NarrationGenerationService _narrationService;
    private readonly MinioService _minio;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NarrationController> _logger;

    public NarrationController(
        AiDbContext db,
        PoiServiceClient poiClient,
        NarrationGenerationService narrationService,
        MinioService minio,
        IConfiguration configuration,
        ILogger<NarrationController> logger)
    {
        _db = db;
        _poiClient = poiClient;
        _narrationService = narrationService;
        _minio = minio;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("narration")]
    [EnableRateLimiting("ai-narration")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(StatusCodes.Status504GatewayTimeout)]
    public async Task<IActionResult> GenerateNarration(
        [FromBody] GenerateNarrationRequest request,
        CancellationToken cancellationToken)
    {
        if (request.PoiId == Guid.Empty || request.SessionId == Guid.Empty)
        {
            return BadRequest(new
            {
                success = false,
                message = "PoiId và SessionId phải là UUID hợp lệ."
            });
        }

        if (string.IsNullOrWhiteSpace(request.LanguageCode) ||
            request.LanguageCode.Length > 10)
        {
            return BadRequest(new
            {
                success = false,
                message = "LanguageCode không hợp lệ."
            });
        }

        // Client phải gửi key để có thể retry khi mất kết nối.
        if (!request.IdempotencyKey.HasValue ||
            request.IdempotencyKey.Value == Guid.Empty)
        {
            return BadRequest(new
            {
                success = false,
                code = "IDEMPOTENCY_KEY_REQUIRED",
                message = "IdempotencyKey là bắt buộc."
            });
        }

        var idempotencyKey = request.IdempotencyKey.Value;

        // Kiểm tra key đã tồn tại hay chưa.
        var priorRequest = await FindRequestByKeyAsync(
            idempotencyKey,
            cancellationToken);

        if (priorRequest is not null)
        {
            return HandleExistingRequest(
                priorRequest,
                request);
        }

        var language = await _db.Languages
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.LanguageCode == request.LanguageCode &&
                     x.IsActive,
                cancellationToken);

        if (language is null)
        {
            return BadRequest(new
            {
                success = false,
                code = "LANGUAGE_NOT_AVAILABLE",
                message = "Ngôn ngữ không tồn tại hoặc đang bị tắt."
            });
        }

        PoiApiResponse? poi;

        try
        {
            poi = await _poiClient.GetVisiblePoiAsync(
                request.PoiId,
                cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            // Client chủ động hủy request: giữ nguyên hành vi hủy.
            throw;
        }
        catch (OperationCanceledException ex)
        {
            // HttpClient hết thời gian chờ khi gọi PoiService.
            _logger.LogWarning(
                ex,
                "PoiService request timed out for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                new
                {
                    success = false,
                    code = "POI_SERVICE_TIMEOUT",
                    message = "PoiService phản hồi quá thời gian chờ."
                });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(
                ex,
                "PoiService HTTP request failed for POI {PoiId}.",
                request.PoiId);

            if (ex.StatusCode.HasValue)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        success = false,
                        code = "POI_SERVICE_ERROR",
                        message = "PoiService trả về lỗi khi lấy thông tin địa điểm."
                    });
            }

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    success = false,
                    code = "POI_SERVICE_UNAVAILABLE",
                    message = "Không thể kết nối đến PoiService."
                });
        }
        catch (System.Text.Json.JsonException ex)
        {
            _logger.LogError(
                ex,
                "PoiService returned an invalid response for POI {PoiId}.",
                request.PoiId);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    code = "POI_SERVICE_ERROR",
                    message = "Dữ liệu phản hồi từ PoiService không hợp lệ."
                });
        }

        if (poi is null)
        {
            return NotFound(new
            {
                success = false,
                code = "POI_NOT_FOUND",
                message = "Không tìm thấy địa điểm hoặc địa điểm đang ẩn."
            });
        }

        var sourceText = poi.Description?.Trim();

        if (string.IsNullOrWhiteSpace(sourceText))
        {
            sourceText = $"{poi.Name}. {poi.Address}";
        }

        var sourceHash = Convert.ToHexString(
            SHA256.HashData(
                Encoding.UTF8.GetBytes(
                    $"{poi.Name}\n{poi.Address}\n{sourceText}"
                )
            )
        ).ToLowerInvariant();

        var narrationRequest = new NarrationRequest
        {
            PoiId = poi.PoiId,
            SessionId = request.SessionId,
            LanguageCode = language.LanguageCode,
            IdempotencyKey = idempotencyKey,
            Status = NarrationRequestStatuses.Pending,
            RequestedAt = DateTime.UtcNow
        };

        _db.NarrationRequests.Add(narrationRequest);

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Có thể một request khác vừa lưu cùng key.
            _db.Entry(narrationRequest).State =
                EntityState.Detached;

            var concurrentRequest = await FindRequestByKeyAsync(
                idempotencyKey,
                cancellationToken);

            if (concurrentRequest is not null)
            {
                return HandleExistingRequest(
                    concurrentRequest,
                    request);
            }

            throw;
        }

        try
        {
            narrationRequest.Status =
                NarrationRequestStatuses.Processing;

            narrationRequest.StartedAt = DateTime.UtcNow;
            narrationRequest.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);

            // Tìm nội dung đã được tạo trước đó.
            var content = await _db.NarrationContents
                .FirstOrDefaultAsync(
                    x => x.PoiId == poi.PoiId &&
                         x.LanguageCode == language.LanguageCode &&
                         x.SourceHash == sourceHash &&
                         x.PromptVersion == PromptVersion &&
                         x.IsActive,
                    cancellationToken);

            if (content is null)
            {
                var generatedText =
                    await _narrationService.GenerateNarrationAsync(
                        poi.Name,
                        sourceText,
                        poi.Address,
                        language.LanguageCode,
                        cancellationToken);

                content = new NarrationContent
                {
                    PoiId = poi.PoiId,
                    LanguageCode = language.LanguageCode,
                    SourceHash = sourceHash,
                    GeneratedText = generatedText,
                    ModelName =
                        _configuration["Ollama:TextModel"]
                        ?? "qwen2.5:3b",
                    PromptVersion = PromptVersion,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _db.NarrationContents.Add(content);

                await _db.SaveChangesAsync(cancellationToken);
            }

            // Tìm audio đã có.
            var audio = await _db.AudioFiles
                .FirstOrDefaultAsync(
                    x => x.ContentId == content.ContentId,
                    cancellationToken);

            if (audio is null)
            {
                var audioBytes =
                    await _narrationService.GenerateSpeechAsync(
                        content.GeneratedText,
                        language.LanguageCode,
                        language.PiperVoice,
                        cancellationToken);

                var objectKey = $"{Guid.NewGuid():N}.mp3";

                await _minio.UploadAudioAsync(
                    objectKey,
                    audioBytes,
                    cancellationToken);

                audio = new AudioFile
                {
                    ContentId = content.ContentId,
                    BucketName =
                        _configuration["MinIO:BucketName"]
                        ?? "narration-audio",
                    ObjectKey = objectKey,
                    ContentType = "audio/mpeg",
                    SizeBytes = audioBytes.LongLength,
                    TtsVoice = language.PiperVoice,
                    CreatedAt = DateTime.UtcNow
                };

                _db.AudioFiles.Add(audio);

                await _db.SaveChangesAsync(cancellationToken);
            }

            narrationRequest.NarrationContentId =
                content.ContentId;

            narrationRequest.Status =
                NarrationRequestStatuses.Success;

            narrationRequest.CompletedAt = DateTime.UtcNow;
            narrationRequest.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);

            return Ok(BuildResponse(
                narrationRequest,
                content,
                audio));
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            narrationRequest.Status =
                NarrationRequestStatuses.Failed;

            narrationRequest.ErrorCode = "REQUEST_CANCELLED";
            narrationRequest.ErrorMessage =
                "The request was cancelled.";

            narrationRequest.CompletedAt = DateTime.UtcNow;
            narrationRequest.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(CancellationToken.None);

            throw;
        }
        catch (Exception ex)
        {
            narrationRequest.Status =
                NarrationRequestStatuses.Failed;

            narrationRequest.ErrorCode =
                ex.GetType().Name.Length > 100
                    ? ex.GetType().Name[..100]
                    : ex.GetType().Name;

            narrationRequest.ErrorMessage = ex.Message;
            narrationRequest.CompletedAt = DateTime.UtcNow;
            narrationRequest.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(CancellationToken.None);

            _logger.LogError(
                ex,
                "Narration generation failed for POI {PoiId}, request {RequestId}.",
                poi.PoiId,
                narrationRequest.RequestId);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    requestId = narrationRequest.RequestId,
                    code = "NARRATION_GENERATION_FAILED",
                    message =
                        "Không thể tạo thuyết minh hoặc audio. " +
                        "Kiểm tra log AiService, Ollama, Piper và MinIO."
                });
        }
    }

    private async Task<NarrationRequest?> FindRequestByKeyAsync(
        Guid idempotencyKey,
        CancellationToken cancellationToken)
    {
        return await _db.NarrationRequests
            .AsNoTracking()
            .Include(x => x.NarrationContent)
                .ThenInclude(x => x!.AudioFile)
            .FirstOrDefaultAsync(
                x => x.IdempotencyKey == idempotencyKey,
                cancellationToken);
    }

    private IActionResult HandleExistingRequest(
        NarrationRequest existing,
        GenerateNarrationRequest incoming)
    {
        // Không cho phép dùng lại key với dữ liệu khác.
        if (existing.PoiId != incoming.PoiId ||
            existing.SessionId != incoming.SessionId ||
            !string.Equals(
                existing.LanguageCode,
                incoming.LanguageCode,
                StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new
            {
                success = false,
                code = "IDEMPOTENCY_KEY_REUSED",
                message =
                    "IdempotencyKey đã được sử dụng cho một yêu cầu khác."
            });
        }

        if (existing.Status == NarrationRequestStatuses.Success &&
            existing.NarrationContent?.AudioFile is { } audio)
        {
            return Ok(BuildResponse(
                existing,
                existing.NarrationContent,
                audio));
        }

        return Conflict(new
        {
            success = false,
            requestId = existing.RequestId,
            status = existing.Status,
            code = "REQUEST_ALREADY_EXISTS",
            message =
                "Yêu cầu này đã tồn tại và đang được xử lý hoặc đã thất bại."
        });
    }

    [HttpGet("audio/{objectName}")]
    [Produces("audio/mpeg")]
    public async Task<IActionResult> GetAudio(
        string objectName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(objectName) ||
            !objectName.EndsWith(
                ".mp3",
                StringComparison.OrdinalIgnoreCase) ||
            !Guid.TryParseExact(
                objectName[..^4],
                "N",
                out _))
        {
            return BadRequest(new
            {
                success = false,
                message = "Tên tệp audio không hợp lệ."
            });
        }

        try
        {
            var bytes = await _minio.DownloadAudioAsync(
                objectName,
                cancellationToken);

            return File(
                bytes,
                "audio/mpeg",
                enableRangeProcessing: true);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to download audio object {ObjectName}.",
                objectName);

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    code = "AUDIO_STORAGE_ERROR",
                    message = "Không thể tải audio từ hệ thống lưu trữ."
                });
        }
    }

    private object BuildResponse(
        NarrationRequest request,
        NarrationContent content,
        AudioFile audio)
    {
        var audioUrl =
            $"{Request.Scheme}://{Request.Host}/api/ai/audio/" +
            Uri.EscapeDataString(audio.ObjectKey);

        return new
        {
            success = true,
            requestId = request.RequestId,
            idempotencyKey = request.IdempotencyKey,
            poiId = request.PoiId,
            sessionId = request.SessionId,
            languageCode = request.LanguageCode,
            status = request.Status,
            narrationContentId = content.ContentId,
            narration = content.GeneratedText,
            audio = new
            {
                audioId = audio.AudioId,
                contentType = audio.ContentType,
                sizeBytes = audio.SizeBytes,
                audioUrl
            }
        };
    }
}