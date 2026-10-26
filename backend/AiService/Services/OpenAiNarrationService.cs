using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace AiService.Services;

/// <summary>
/// Gọi OpenAI API để sinh nội dung thuyết minh và chuyển văn bản thành giọng nói.
/// API key chỉ được đọc từ cấu hình môi trường, không ghi vào mã nguồn.
/// </summary>
public sealed class OpenAiNarrationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public OpenAiNarrationService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> GenerateNarrationAsync(
        string name,
        string description,
        string location,
        string language,
        CancellationToken cancellationToken)
    {
        var apiKey = GetApiKey();
        var baseUrl = GetBaseUrl();
        var model = _configuration["OpenAI:TextModel"] ?? "gpt-4o-mini";

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(new
        {
            model,
            temperature = 0.7,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = "Bạn là hướng dẫn viên du lịch. Hãy viết lời thuyết minh chính xác, tự nhiên, dễ nghe, phù hợp khách tham quan. Chỉ sử dụng dữ kiện được cung cấp; không bịa thêm sự kiện lịch sử, ngày tháng hoặc số liệu. Độ dài khoảng 120-180 từ. Chỉ trả về lời thuyết minh, không thêm tiêu đề hay lời dẫn ngoài nội dung."
                },
                new
                {
                    role = "user",
                    content = $"Hãy viết lời thuyết minh về địa điểm sau bằng ngôn ngữ: {language}.\nTên: {name}\nMô tả được cung cấp: {description}\nĐịa chỉ: {location}\nNếu dữ liệu chưa đủ để khẳng định một thông tin, không tự suy đoán."
                }
            }
        });

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"OpenAI tạo thuyết minh thất bại (HTTP {(int)response.StatusCode}): {GetSafeError(responseBody)}",
                null,
                response.StatusCode);
        }

        using var document = JsonDocument.Parse(responseBody);
        var text = document.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(text))
            throw new InvalidDataException("AI trả về nội dung thuyết minh rỗng.");

        return text.Trim();
    }

    public async Task<byte[]> GenerateSpeechAsync(
        string narrationText,
        string? requestedVoice,
        CancellationToken cancellationToken)
    {
        var apiKey = GetApiKey();
        var baseUrl = GetBaseUrl();
        var model = _configuration["OpenAI:TtsModel"] ?? "gpt-4o-mini-tts";
        var configuredVoice = _configuration["OpenAI:TtsVoice"] ?? "alloy";
        var voice = string.IsNullOrWhiteSpace(requestedVoice) ? configuredVoice : requestedVoice.Trim();

        // Chỉ cho phép các voice phổ biến của OpenAI để tránh gửi giá trị tùy ý.
        var allowedVoices = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer"
        };
        if (!allowedVoices.Contains(voice))
            throw new ArgumentException("Voice không hợp lệ. Hãy dùng alloy, ash, ballad, coral, echo, fable, nova, onyx, sage hoặc shimmer.");

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}audio/speech");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = JsonContent.Create(new
        {
            model,
            voice = voice.ToLowerInvariant(),
            input = narrationText,
            response_format = "mp3"
        });

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException(
                $"OpenAI chuyển văn bản thành giọng nói thất bại (HTTP {(int)response.StatusCode}): {GetSafeError(responseBody)}",
                null,
                response.StatusCode);
        }

        var audio = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        if (audio.Length == 0)
            throw new InvalidDataException("Nhà cung cấp TTS trả về tệp âm thanh rỗng.");

        return audio;
    }

    private string GetApiKey()
    {
        var key = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("Chưa cấu hình OPENAI_API_KEY trong backend/.env. Hãy thêm API key của nhà cung cấp OpenAI trước khi gọi chức năng AI/TTS.");
        return key;
    }

    private string GetBaseUrl()
    {
        var baseUrl = _configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1/";
        return baseUrl.EndsWith('/') ? baseUrl : baseUrl + "/";
    }

    private static string GetSafeError(string responseBody)
    {
        // Tránh đưa toàn bộ phản hồi nhà cung cấp vào log hoặc lỗi API.
        return responseBody.Length <= 500 ? responseBody : responseBody[..500];
    }
}
