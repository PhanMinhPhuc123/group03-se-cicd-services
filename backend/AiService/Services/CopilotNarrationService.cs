
using GitHub.Copilot;

namespace AiService.Services;

/// <summary>
/// Sinh nội dung thuyết minh bằng GitHub Copilot SDK.
/// </summary>
public sealed class CopilotNarrationService
{
    private readonly ILogger<CopilotNarrationService> _logger;

    public CopilotNarrationService(
        ILogger<CopilotNarrationService> logger)
    {
        _logger = logger;
    }

    public async Task<string> GenerateNarrationAsync(
        string name,
        string description,
        string location,
        string language,
        CancellationToken cancellationToken)
    {
        await using var client = new CopilotClient();

        await using var session = await client.CreateSessionAsync(
            new SessionConfig
            {
                Model = "auto",
                SystemMessage = new SystemMessageConfig
                {
                    Content = """
                        Bạn là hướng dẫn viên du lịch.
                        Hãy viết lời thuyết minh chính xác, tự nhiên,
                        dễ nghe và chỉ sử dụng dữ liệu được cung cấp.
                        Không tự bịa sự kiện lịch sử, ngày tháng hoặc số liệu.
                        Độ dài khoảng 120-180 từ.
                        Chỉ trả về nội dung thuyết minh, không thêm tiêu đề.
                        """
                }
            },
            cancellationToken);

        var prompt = $"""
            Hãy viết lời thuyết minh về địa điểm sau bằng ngôn ngữ: {language}.

            Tên địa điểm: {name}
            Mô tả được cung cấp: {description}
            Địa chỉ: {location}

            Nếu dữ liệu chưa đủ để khẳng định thông tin,
            không tự suy đoán.
            """;

        var response = await session.SendAndWaitAsync(
            new MessageOptions { Prompt = prompt },
            TimeSpan.FromMinutes(2),
            cancellationToken);

        var text = response?.Data.Content;

        if (string.IsNullOrWhiteSpace(text))
        {
            _logger.LogWarning(
                "Copilot không trả về nội dung thuyết minh cho {PoiName}.",
                name);

            throw new InvalidOperationException(
                "Copilot không trả về nội dung thuyết minh.");
        }

        return text.Trim();
    }
}
