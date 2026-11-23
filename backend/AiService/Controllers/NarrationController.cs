using System.Security.Cryptography;
using System.Text;
using System.Diagnostics;
using System.Globalization;
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
    private const string PromptVersion = "v2";

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

    /// <summary>
    /// Generates narration text and audio for a POI and visit session.
    /// </summary>
    /// <remarks>
    /// The request must include an idempotency key.
    /// Reusing the same key with a different payload returns HTTP 409.
    /// A successful response includes the request ID, narration text,
    /// audio metadata and an audio playback URL.
    /// </remarks>
    [HttpPost("narration")]
    [EnableRateLimiting("ai-narration")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
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

        // A failed request may be retried with the same key and identical payload.
        // ExecuteUpdate makes the retry claim atomic: only one concurrent caller wins.
        NarrationRequest? retryRequest = null;
        var priorRequest = await FindRequestByKeyAsync(
            idempotencyKey,
            cancellationToken);

        if (priorRequest is not null)
        {
            if (priorRequest.PoiId != request.PoiId ||
                priorRequest.SessionId != request.SessionId ||
                !string.Equals(
                    priorRequest.LanguageCode,
                    request.LanguageCode,
                    StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new
                {
                    success = false,
                    code = "IDEMPOTENCY_KEY_REUSED",
                    message = "IdempotencyKey đã được sử dụng cho một yêu cầu khác."
                });
            }

            if (priorRequest.Status == NarrationRequestStatuses.Success &&
                priorRequest.NarrationContent is { } cachedContent)
            {
                return Ok(BuildResponse(
                    priorRequest,
                    cachedContent,
                    IsAudioSupported(priorRequest.LanguageCode)
                        ? cachedContent.AudioFile
                        : null));
            }

            if (priorRequest.Status != NarrationRequestStatuses.Failed)
            {
                return HandleExistingRequest(priorRequest, request);
            }

            var retryClaimed = await _db.NarrationRequests
                .Where(x => x.RequestId == priorRequest.RequestId &&
                            x.Status == NarrationRequestStatuses.Failed)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.Status, NarrationRequestStatuses.Pending)
                    .SetProperty(x => x.RetryCount, x => x.RetryCount + 1)
                    .SetProperty(x => x.ErrorCode, (string?)null)
                    .SetProperty(x => x.ErrorMessage, (string?)null)
                    .SetProperty(x => x.StartedAt, (DateTime?)null)
                    .SetProperty(x => x.CompletedAt, (DateTime?)null)
                    .SetProperty(x => x.UpdatedAt, DateTime.UtcNow),
                    cancellationToken);

            if (retryClaimed == 0)
            {
                var latest = await FindRequestByKeyAsync(
                    idempotencyKey,
                    cancellationToken);
                return latest is null
                    ? Conflict(new { success = false, code = "RETRY_CONFLICT", message = "Không thể nhận lại yêu cầu." })
                    : HandleExistingRequest(latest, request);
            }

            retryRequest = await _db.NarrationRequests
                .FirstAsync(x => x.RequestId == priorRequest.RequestId, cancellationToken);
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


        // Persist a new request before calling dependencies. A claimed retry reuses its row.
        var narrationRequest = retryRequest ?? new NarrationRequest
        {
            PoiId = request.PoiId,
            SessionId = request.SessionId,
            LanguageCode = language.LanguageCode,
            IdempotencyKey = idempotencyKey,
            Status = NarrationRequestStatuses.Pending,
            RequestedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (retryRequest is null)
        {
            _db.NarrationRequests.Add(narrationRequest);

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                _db.Entry(narrationRequest).State = EntityState.Detached;

                var concurrentRequest = await FindRequestByKeyAsync(
                    idempotencyKey,
                    cancellationToken);

                if (concurrentRequest is not null)
                {
                    return HandleExistingRequest(concurrentRequest, request);
                }

                throw;
            }
        }

        // Chỉ gọi PoiService sau khi request đã được lưu thành công.
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
            await MarkRequestFailedAsync(
                narrationRequest,
                "REQUEST_CANCELLED",
                "The request was cancelled.");

            throw;
        }
        catch (OperationCanceledException ex)
        {
            _logger.LogWarning(
                ex,
                "PoiService request timed out for POI {PoiId}.",
                request.PoiId);

            await MarkRequestFailedAsync(
                narrationRequest,
                "POI_SERVICE_TIMEOUT",
                "PoiService phản hồi quá thời gian chờ.");

            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                new
                {
                    success = false,
                    requestId = narrationRequest.RequestId,
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
                await MarkRequestFailedAsync(
                    narrationRequest,
                    "POI_SERVICE_ERROR",
                    "PoiService trả về lỗi khi lấy thông tin địa điểm.");

                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    new
                    {
                        success = false,
                        requestId = narrationRequest.RequestId,
                        code = "POI_SERVICE_ERROR",
                        message = "PoiService trả về lỗi khi lấy thông tin địa điểm."
                    });
            }

            await MarkRequestFailedAsync(
                narrationRequest,
                "POI_SERVICE_UNAVAILABLE",
                "Không thể kết nối đến PoiService.");

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    success = false,
                    requestId = narrationRequest.RequestId,
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

            await MarkRequestFailedAsync(
                narrationRequest,
                "POI_SERVICE_ERROR",
                "Dữ liệu phản hồi từ PoiService không hợp lệ.");

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    requestId = narrationRequest.RequestId,
                    code = "POI_SERVICE_ERROR",
                    message = "Dữ liệu phản hồi từ PoiService không hợp lệ."
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unexpected PoiService error for POI {PoiId}.",
                request.PoiId);

            await MarkRequestFailedAsync(
                narrationRequest,
                "POI_SERVICE_ERROR",
                "Có lỗi xảy ra khi lấy thông tin địa điểm.");

            return StatusCode(
                StatusCodes.Status502BadGateway,
                new
                {
                    success = false,
                    requestId = narrationRequest.RequestId,
                    code = "POI_SERVICE_ERROR",
                    message = "Có lỗi xảy ra khi lấy thông tin địa điểm."
                });
        }

        if (poi is null)
        {
            await MarkRequestFailedAsync(
                narrationRequest,
                "POI_NOT_FOUND",
                "Không tìm thấy địa điểm hoặc địa điểm đang ẩn.");

            return NotFound(new
            {
                success = false,
                requestId = narrationRequest.RequestId,
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

        string? uploadedObjectKey = null;

        try
        {
            narrationRequest.Status =
                NarrationRequestStatuses.Processing;

            narrationRequest.StartedAt = DateTime.UtcNow;
            narrationRequest.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);

            // Serialize generation for the same POI/language/source/prompt across
            // all AiService instances. PostgreSQL releases this lock at transaction end.
            await using var contentTransaction =
                await _db.Database.BeginTransactionAsync(cancellationToken);

            var lockIdentity =
                $"{poi.PoiId}|{language.LanguageCode}|{sourceHash}|{PromptVersion}";
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT pg_advisory_xact_lock(hashtextextended({lockIdentity}, 0))",
                cancellationToken);

            // Re-check after acquiring the lock; another request may have completed
            // content/audio generation while this request was waiting.
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

            // Chỉ tạo/tái sử dụng audio cho tiếng Việt, Anh và Trung.
            // Các ngôn ngữ còn lại vẫn hoàn tất phần văn bản, không gọi Piper.
            AudioFile? audio = null;

            if (IsAudioSupported(language.LanguageCode))
            {
                audio = await _db.AudioFiles
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

                    var durationSeconds =
                        await GetAudioDurationSecondsAsync(
                            audioBytes,
                            cancellationToken);

                    var objectKey = $"{Guid.NewGuid():N}.mp3";

                    // Assign before upload so a partially completed upload can be cleaned up.
                    uploadedObjectKey = objectKey;

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
                        DurationSeconds = durationSeconds,
                        SizeBytes = audioBytes.LongLength,
                        TtsVoice = language.PiperVoice,
                        CreatedAt = DateTime.UtcNow
                    };

                    _db.AudioFiles.Add(audio);

                    await _db.SaveChangesAsync(cancellationToken);
                }
            }

            narrationRequest.NarrationContentId =
                content.ContentId;

            narrationRequest.Status =
                NarrationRequestStatuses.Success;

            narrationRequest.CompletedAt = DateTime.UtcNow;
            narrationRequest.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
            await contentTransaction.CommitAsync(cancellationToken);

            return Ok(BuildResponse(
                narrationRequest,
                content,
                audio));
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
            // Clean up a possibly uploaded object when the request is cancelled.
            if (!string.IsNullOrWhiteSpace(uploadedObjectKey))
            {
                try
                {
                    await _minio.DeleteAudioAsync(
                        uploadedObjectKey,
                        CancellationToken.None);
                }
                catch (Exception cleanupException)
                {
                    _logger.LogError(
                        cleanupException,
                        "Failed to clean up MinIO object {ObjectKey} after request cancellation.",
                        uploadedObjectKey);
                }
            }

            _db.ChangeTracker.Clear();

            var failedRequest = await _db.NarrationRequests
                .FirstAsync(
                    x => x.RequestId == narrationRequest.RequestId,
                    CancellationToken.None);

            failedRequest.Status = NarrationRequestStatuses.Failed;
            failedRequest.ErrorCode = "REQUEST_CANCELLED";
            failedRequest.ErrorMessage = "Yêu cầu đã bị hủy.";
            failedRequest.CompletedAt = DateTime.UtcNow;
            failedRequest.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
        catch (Exception ex)
        {
            if (!string.IsNullOrWhiteSpace(uploadedObjectKey))
            {
                try
                {
                    await _minio.DeleteAudioAsync(
                        uploadedObjectKey,
                        CancellationToken.None);
                }
                catch (Exception cleanupException)
                {
                    _logger.LogError(
                        cleanupException,
                        "Failed to clean up orphaned MinIO object {ObjectKey}.",
                        uploadedObjectKey);
                }
            }

            _db.ChangeTracker.Clear();
            var failedRequest = await _db.NarrationRequests
                .FirstAsync(x => x.RequestId == narrationRequest.RequestId,
                    CancellationToken.None);

            failedRequest.Status = NarrationRequestStatuses.Failed;
            failedRequest.ErrorCode = "NARRATION_GENERATION_FAILED";
            failedRequest.ErrorMessage =
                "Không thể tạo nội dung hoặc lưu audio. Vui lòng thử lại.";
            failedRequest.CompletedAt = DateTime.UtcNow;
            failedRequest.UpdatedAt = DateTime.UtcNow;

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

    private async Task MarkRequestFailedAsync(
        NarrationRequest request,
        string errorCode,
        string errorMessage)
    {
        request.Status = NarrationRequestStatuses.Failed;
        request.ErrorCode = errorCode.Length > 100
            ? errorCode[..100]
            : errorCode;
        request.ErrorMessage = errorMessage;
        request.CompletedAt = DateTime.UtcNow;
        request.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(CancellationToken.None);
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
            existing.NarrationContent is { } content)
        {
            return Ok(BuildResponse(
                existing,
                content,
                IsAudioSupported(existing.LanguageCode)
                    ? content.AudioFile
                    : null));
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

    /// <summary>
    /// Downloads generated narration audio for browser playback.
    /// </summary>
    [HttpGet("audio/{objectName}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
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
        catch (Minio.Exceptions.ObjectNotFoundException)
        {
            return NotFound(new
            {
                success = false,
                code = "AUDIO_NOT_FOUND",
                message = "Không tìm thấy tệp audio."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download audio object {ObjectName}.", objectName);

            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                success = false,
                code = "AUDIO_STORAGE_ERROR",
                message = "Không thể tải audio từ hệ thống lưu trữ."
            });
        }
    }

    private static async Task<decimal> GetAudioDurationSecondsAsync(
        byte[] audioBytes,
        CancellationToken cancellationToken)
    {
        if (audioBytes == null || audioBytes.Length == 0)
        {
            throw new ArgumentException(
                "Audio data must not be empty.",
                nameof(audioBytes));
        }

        var tempFilePath = Path.Combine(
            Path.GetTempPath(),
            $"{Guid.NewGuid():N}.mp3");

        try
        {
            await System.IO.File.WriteAllBytesAsync(
                tempFilePath,
                audioBytes,
                cancellationToken);

            var startInfo = new ProcessStartInfo
            {
                FileName = "ffprobe",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            startInfo.ArgumentList.Add("-v");
            startInfo.ArgumentList.Add("error");
            startInfo.ArgumentList.Add("-show_entries");
            startInfo.ArgumentList.Add("format=duration");
            startInfo.ArgumentList.Add("-of");
            startInfo.ArgumentList.Add(
                "default=noprint_wrappers=1:nokey=1");
            startInfo.ArgumentList.Add("-i");
            startInfo.ArgumentList.Add(tempFilePath);

            using var process = new Process
            {
                StartInfo = startInfo
            };

            if (!process.Start())
            {
                throw new InvalidOperationException(
                    "Could not start FFprobe.");
            }

            var outputTask =
                process.StandardOutput.ReadToEndAsync();

            var errorTask =
                process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync(cancellationToken);

            var output = await outputTask;
            var error = await errorTask;

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException(
                    $"FFprobe failed to read audio: {error}");
            }

            if (!decimal.TryParse(
                output.Trim(),
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var durationSeconds) ||
                durationSeconds <= 0)
            {
                throw new InvalidOperationException(
                    "Could not determine audio duration.");
            }

            return Math.Round(
                durationSeconds,
                2,
                MidpointRounding.AwayFromZero);
        }
        finally
        {
            if (System.IO.File.Exists(tempFilePath))
            {
                System.IO.File.Delete(tempFilePath);
            }
        }
    }

    private static bool IsAudioSupported(string languageCode)
    {
        return languageCode.Trim().ToLowerInvariant() switch
        {
            "vi" or "vi-vn" => true,
            "en" or "en-us" or "en-gb" => true,
            "zh" or "zh-cn" or "zh-tw" => true,
            _ => false
        };
    }

    private object BuildResponse(
        NarrationRequest request,
        NarrationContent content,
        AudioFile? audio)
    {
        var audioResponse = audio is null
            ? null
            : new
            {
                audioId = audio.AudioId,
                contentType = audio.ContentType,
                sizeBytes = audio.SizeBytes,
                audioUrl = $"{Request.Scheme}://{Request.Host}/api/ai/audio/" +
                    Uri.EscapeDataString(audio.ObjectKey)
            };

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
            audio = audioResponse
        };
    }
}