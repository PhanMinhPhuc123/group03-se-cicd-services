
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AiService.Services;

/// <summary>
/// Generates POI narration with a local Ollama model and converts
/// narration text to speech through the configured OpenAI-compatible TTS API.
/// API keys are read from configuration and are never hard-coded.
/// </summary>
public sealed class OpenAiNarrationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public OpenAiNarrationService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    // =========================================================
    // GENERATE NARRATION
    // =========================================================

    public async Task<string> GenerateNarrationAsync(
        string name,
        string description,
        string location,
        string language,
        CancellationToken cancellationToken)
    {
        // 1. Normalize the requested language first.
        var languageCode = language.Trim().ToLowerInvariant() switch
        {
            "vi" or "vi-vn" or "vietnamese" or "tiếng việt" => "vi",

            "en" or "en-us" or "en-gb" or "english" => "en",

            "zh" or "zh-cn" or "zh-tw" or "chinese" or "中文" => "zh",

            "ja" or "ja-jp" or "japanese" or "日本語" => "ja",

            "ko" or "ko-kr" or "korean" or "한국어" => "ko",

            _ => throw new ArgumentException(
                $"Unsupported narration language: {language}")
        };

        // 2. Map the normalized code to a readable language name.
        var targetLanguage = languageCode switch
        {
            "vi" => "Vietnamese",
            "en" => "English",
            "zh" => "Simplified Chinese",
            "ja" => "Japanese",
            "ko" => "Korean",

            _ => throw new InvalidOperationException(
                "Unsupported narration language.")
        };

        // 3. Language-specific generation rules.
        var languageRules = languageCode switch
        {
            "vi" =>
                "Write entirely in natural Vietnamese with correct Vietnamese spelling and diacritics.",

            "en" =>
                "Write entirely in natural English. " +
                "The source description is in Vietnamese, but the entire output must be translated into English. " +
                "Never answer in Vietnamese. " +
                "Translate the meaning of every sentence instead of copying the source text. " +
                "Preserve the important factual details and do not invent facts. " +
                "Use Vietnamese proper names only when appropriate; the surrounding sentences must remain English.",

            "zh" =>
                "Write entirely in natural Simplified Chinese (简体中文). " +
                "The output must be written in Chinese, not Vietnamese or English. " +
                "Do not use Japanese Hiragana, Japanese Katakana, or Korean Hangul. " +
                "Preserve the historical and cultural meaning of the source. " +
                "Use natural Chinese expressions suitable for a spoken tourist guide. " +
                "Do not invent facts or add unsupported details.",

            "ja" =>
                "Write entirely in natural Japanese using hiragana or katakana and kanji where appropriate. Render Vietnam as ベトナム. Do not include Vietnamese or English words.",

            "ko" =>
                "Write entirely in natural Korean using Hangul and natural Korean word order. " +
                "Translate 'Vietnam War' as '베트남 전쟁'. " +
                "Translate 'the end of the Vietnam War in 1975' as '1975년 베트남 전쟁의 종식'. " +
                "For example, a natural translation of a historical building related to the event " +
                "marking the end of the Vietnam War in 1975 is: " +
                "'이 역사적 건축물은 1975년 베트남 전쟁의 종식과 관련이 있습니다.' " +
                "Do not translate word by word. Do not include Vietnamese or English phrases.",

            _ => throw new InvalidOperationException(
                "Unsupported narration language.")
        };

        // 4. System prompt: instruct the model to translate faithfully.
        var systemPrompt =
            "You are a professional multilingual tour guide. " +
            $"The required output language is {targetLanguage}. " +
            $"{languageRules} " +
            "Create a detailed, natural spoken narration for a visitor exploring this place. " +
            "Use 5 to 7 complete, well-developed sentences, aiming for around 100 to 150 words when the source contains enough information. " +
            "Preserve the important historical, architectural, cultural, and visitor information present in the source description. " +
            "Explain the supplied information naturally instead of reducing it to a brief summary. " +
            "Do not invent facts, dates, historical events, attractions, opening hours, or opinions. " +
            "Use the place name as context and do not invent additional facts from the location. " +
            "Write in a clear, warm style suitable for listening to an audio tour. " +
            "Use only the requested language and do not mix languages. " +
            "Return only the narration text, without a title, numbered list, or explanation.";

        // 5. User prompt: provide the POI context and source description.
        var userPrompt = languageCode == "zh"
            ? $"目标语言：简体中文（普通话）。\n" +
            $"景点名称：{name}\n" +
            $"地点：{location}\n\n" +
            "请将下面的越南语资料改写为适合游客聆听的简体中文导览词。" +
            "请使用5到7个完整的句子，保留原文中的历史、建筑和文化信息。" +
            "只使用自然、流畅的简体中文，不要输出越南语、英语、日文假名或韩文。" +
            "不得编造历史事实、日期或其他原文没有的信息。" +
            "只输出导览正文，不要添加标题、编号或解释。\n\n" +
            $"越南语原文：\n{description}"
            : $"Target language: {targetLanguage}\n" +
            $"Place name: {name}\n" +
            $"Location: {location}\n\n" +
            "Create a detailed spoken tour narration based only on the source description below. " +
            "Retain its important details and explain them in natural, complete sentences. " +
            "Do not reduce the content to one or two sentences or add unsupported information. " +
            "Return only the narration text.\n\n" +
            $"Source description:\n{description}";

        // 6. Configure the local Ollama model.
        var baseUrl = GetOllamaBaseUrl();

        var model = _configuration["Ollama:TextModel"]
            ?? "qwen2.5:3b";

        // Nếu lần đầu sinh sai ngôn ngữ, yêu cầu model dịch lại một lần.
        var retryInstruction = languageCode switch
        {
            "vi" =>
                "Rewrite entirely in natural Vietnamese with correct Vietnamese spelling.",

            "en" =>
                "Rewrite the entire narration in natural English. " +
                "The previous output was incorrect because it used Vietnamese. " +
                "Translate every sentence into English; do not copy Vietnamese sentences. " +
                "Preserve the source meaning and do not invent facts.",

            "zh" =>
                "请重新生成完整的简体中文导览词。 " +
                "必须使用自然的简体中文，写5到7个完整句子。 " +
                "不要输出越南语、英语、日文假名或韩文。 " +
                "保留原文中的事实，不得编造信息。 " +
                "只输出简体中文正文，不要添加标题或解释。",

            "ja" =>
                "Rewrite entirely in natural Japanese using Japanese kana and kanji. Translate Vietnam as ベトナム. Do not use Vietnamese or English phrases.",

            "ko" =>
                "Rewrite the entire narration in natural Korean with correct Korean word order. " +
                "Use '베트남 전쟁' for 'Vietnam War' and " +
                "'1975년 베트남 전쟁의 종식' for 'the end of the Vietnam War in 1975'. " +
                "For this source description, use a natural structure such as " +
                "'이 역사적 건축물은 1975년 베트남 전쟁의 종식과 관련이 있습니다.' " +
                "Do not use the phrase '전쟁 베트남' or the awkward wording '종전을 끝내는'. " +
                "Do not include Vietnamese or English phrases.",

            _ => $"Rewrite entirely in {targetLanguage}."
        };

        for (var attempt = 1; attempt <= 2; attempt++)
        {
            var currentSystemPrompt = attempt == 1
                ? systemPrompt
                : systemPrompt + "\n\nIMPORTANT CORRECTION: " +
                retryInstruction +
                " Keep the narration detailed, with 5 to 7 complete sentences when supported by the source. " +
                "Do not shorten it to one or two sentences. " +
                "Do not invent facts or change the source meaning. " +
                "Return only the corrected narration.";

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{baseUrl}chat/completions");

            request.Content = JsonContent.Create(new
            {
                model,
                temperature = 0.0,
                top_p = 0.1,
                max_tokens = 500,
                stream = false,
                messages = new object[]
                {
                    new
                    {
                        role = "system",
                        content = currentSystemPrompt
                    },
                    new
                    {
                        role = "user",
                        content = userPrompt
                    }
                }
            });

            using var response = await _httpClient.SendAsync(
                request,
                cancellationToken);

            var responseBody = await response.Content.ReadAsStringAsync(
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"Ollama narration failed (HTTP {(int)response.StatusCode}): " +
                    GetSafeError(responseBody),
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
            {
                if (attempt == 2)
                {
                    throw new InvalidDataException(
                        $"Ollama returned an empty narration for {targetLanguage}.");
                }

                continue;
            }

            text = text.Trim();

            Console.WriteLine(
                $"[NarrationDebug] Output for '{languageCode}', attempt {attempt}: " +
                text[..Math.Min(text.Length, 300)]);

            if (MatchesRequestedLanguage(text, languageCode))
            {
                // Return only after the output passes language validation.
                return text;
            }

            Console.WriteLine(
                $"[NarrationDebug] Attempt {attempt} rejected for language '{languageCode}'.");
        }

        throw new InvalidDataException(
            $"The narration generated by model '{model}' " +
            $"did not pass {targetLanguage} validation after two attempts.");

    }

    // =========================================================
    // TEXT-TO-SPEECH
    // =========================================================

    public async Task<byte[]> GenerateSpeechAsync(
        string narrationText,
        string? requestedVoice,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(narrationText))
        {
            throw new ArgumentException(
                "Narration text must not be empty.",
                nameof(narrationText));
        }

        var apiKey = GetApiKey();
        var baseUrl = GetBaseUrl();

        var model = _configuration["OpenAI:TtsModel"]
            ?? "gpt-4o-mini-tts";

        var configuredVoice = _configuration["OpenAI:TtsVoice"]
            ?? "alloy";

        var voice = string.IsNullOrWhiteSpace(requestedVoice)
            ? configuredVoice
            : requestedVoice.Trim();

        // Allow known voices only.
        var allowedVoices = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase)
        {
            "alloy",
            "ash",
            "ballad",
            "coral",
            "echo",
            "fable",
            "nova",
            "onyx",
            "sage",
            "shimmer"
        };

        if (!allowedVoices.Contains(voice))
        {
            throw new ArgumentException(
                "Voice không hợp lệ. Hãy dùng alloy, ash, ballad, " +
                "coral, echo, fable, nova, onyx, sage hoặc shimmer.");
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{baseUrl}audio/speech");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = JsonContent.Create(new
        {
            model,
            voice = voice.ToLowerInvariant(),
            input = narrationText,
            response_format = "mp3"
        });

        using var response = await _httpClient.SendAsync(
            request,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync(
                cancellationToken);

            throw new HttpRequestException(
                "OpenAI chuyển văn bản thành giọng nói thất bại " +
                $"(HTTP {(int)response.StatusCode}): " +
                GetSafeError(responseBody),
                null,
                response.StatusCode);
        }

        var audio = await response.Content.ReadAsByteArrayAsync(
            cancellationToken);

        if (audio.Length == 0)
        {
            throw new InvalidDataException(
                "Nhà cung cấp TTS trả về tệp âm thanh rỗng.");
        }

        return audio;
    }

    // =========================================================
    // LANGUAGE VALIDATION
    // =========================================================

    private static bool MatchesRequestedLanguage(
        string text,
        string languageCode)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        text = text.Trim();

        bool hasVietnameseDiacritics = Regex.IsMatch(
            text,
            @"[ăâđêôơưĂÂĐÊÔƠƯ\u1EA0-\u1EF9]");

        bool hasHangul = Regex.IsMatch(
            text,
            @"[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]");

        bool hasKana = Regex.IsMatch(
            text,
            @"[\u3040-\u30FF]");

        bool hasHan = Regex.IsMatch(
            text,
            @"[\u4E00-\u9FFF]");

        bool hasLatinLetters = Regex.IsMatch(
            text,
            @"[A-Za-z]");

        bool hasVietnameseMarkers = Regex.IsMatch(
            text,
            @"\b(là|một|được|trong|này|và|của|với|có|đây|những|các|từ|đến|công trình|lịch sử|thành phố|du khách|tham quan|xây dựng|gắn liền|nơi đây)\b",
            RegexOptions.IgnoreCase);

        switch (languageCode.Trim().ToLowerInvariant())
        {
            case "en":
            case "en-us":
            case "en-gb":
            case "english":
                return hasLatinLetters
                    && !hasHangul
                    && !hasKana
                    && !hasHan
                    && !hasVietnameseMarkers
                    && Regex.IsMatch(
                        text,
                        @"\b(the|a|an|and|or|is|are|was|were|be|been|in|on|at|of|to|for|from|with|by|that|this|it|its|as|which|who|has|have|had|located|known|historical|history|landmark|monument|city|palace|built|famous|commemorates|reflects|represents|stands|offers|associated|related|important|visitors|building|museum|market|garden|river|site|architecture|tourists|constructed|features|contains|provides)\b",
                        RegexOptions.IgnoreCase);

            case "vi":
            case "vi-vn":
            case "vietnamese":
                return hasVietnameseDiacritics
                    && !hasHangul
                    && !hasKana
                    && !hasHan;

            case "zh":
            case "zh-cn":
            case "zh-tw":
            case "chinese":
                // Cho phép tên riêng Latin hoặc tiếng Việt,
                // miễn nội dung có chữ Hán và không bị lẫn
                // hệ chữ Hangul hoặc Kana.
                return hasHan
                    && !hasHangul
                    && !hasKana;

            case "ja":
            case "ja-jp":
            case "japanese":
                // Tiếng Nhật thường có Hiragana/Katakana,
                // đồng thời có thể dùng Kanji và tên riêng Latin.
                return hasKana
                    && !hasHangul;

            case "ko":
            case "ko-kr":
            case "korean":
                // Cho phép tên riêng Latin hoặc tiếng Việt
                // trong nội dung tiếng Hàn.
                return hasHangul
                    && !hasKana;

            default:
                return false;
        }
    }

    // =========================================================
    // CONFIGURATION HELPERS
    // =========================================================

    private string GetApiKey()
    {
        var key = _configuration["OpenAI:ApiKey"];

        if (string.IsNullOrWhiteSpace(key))
        {
            throw new InvalidOperationException(
                "Chưa cấu hình OPENAI_API_KEY trong backend/.env. " +
                "Hãy thêm API key của nhà cung cấp trước khi gọi chức năng TTS.");
        }

        return key;
    }

    private string GetBaseUrl()
    {
        var baseUrl = _configuration["OpenAI:BaseUrl"]
            ?? "https://api.openai.com/v1/";

        return baseUrl.EndsWith('/')
            ? baseUrl
            : baseUrl + "/";
    }

    private string GetOllamaBaseUrl()
    {
        var baseUrl = _configuration["Ollama:BaseUrl"]
            ?? "http://host.docker.internal:11434/v1/";

        return baseUrl.EndsWith('/')
            ? baseUrl
            : baseUrl + "/";
    }

    private static string GetSafeError(string responseBody)
    {
        // Limit the length of provider error messages.
        return responseBody.Length <= 500
            ? responseBody
            : responseBody[..500];
    }
}
