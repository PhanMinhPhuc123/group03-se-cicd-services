
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AiService.Services;

/// <summary>
/// Generates narration text with local Ollama and speech audio with local Piper TTS.
/// Uses local Ollama for narration text and Piper TTS for audio; no external AI API key is required.
/// </summary>
public sealed class NarrationGenerationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public NarrationGenerationService(
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
        var languageCode = NormalizeLanguage(language);

        // 2. Map the normalized code to a readable language name.
        var targetLanguage = languageCode switch
        {
            "vi" => "Vietnamese",
            "en" => "English",
            "zh" => "Simplified Chinese",
            "ja" => "Japanese",
            "ko" => "Korean",
            "es" => "Spanish",
            "fr" => "French",
            "de" => "German",
            "ru" => "Russian",
            "th" => "Thai",

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

            "es" =>
                "Write entirely in natural Spanish. Translate the Vietnamese source faithfully, " +
                "preserve important facts, and do not invent information. Use natural expressions " +
                "suitable for a spoken tourist guide.",

            "fr" =>
                "Write entirely in natural French. Translate the Vietnamese source faithfully, " +
                "preserve important facts, and do not invent information. Use natural expressions " +
                "suitable for a spoken tourist guide.",

            "de" =>
                "Write entirely in natural German. Translate the Vietnamese source faithfully, " +
                "preserve important facts, and do not invent information. Use natural expressions " +
                "suitable for a spoken tourist guide.",

            "ru" =>
                "Write entirely in natural Russian using Cyrillic. Translate the Vietnamese source " +
                "faithfully, preserve important facts, and do not invent information. Use natural " +
                "expressions suitable for a spoken tourist guide.",

            "th" =>
                "Write entirely in natural Thai using Thai script. Translate the Vietnamese source " +
                "faithfully, preserve important facts, and do not invent information. Use natural " +
                "expressions suitable for a spoken tourist guide.",

            _ => throw new InvalidOperationException(
                "Unsupported narration language.")
        };

        // 4. System prompt: instruct the model to translate faithfully.
        var systemPrompt =
            "You are a professional multilingual tour guide. " +
            $"The required output language is {targetLanguage}. " +
            $"{languageRules} " +
            "Create a natural spoken narration for a visitor exploring this place. " +
            "Prioritize factual accuracy and faithfully preserve the information in the source. " +
            "Aim for 5 to 7 complete sentences when the source contains enough distinct information. " +
            "For shorter sources, use fewer sentences rather than repeating ideas or inventing details. " +
            "Preserve the important historical, architectural, cultural, and visitor information present in the source. " +
            "You may reorganize related facts into natural sentences, but must not add unsupported details. " +
            "Do not invent facts, dates, historical events, attractions, opening hours, or opinions. " +
            "Use the place name as context and do not infer additional facts from the location. " +
            "Write in a clear, warm style suitable for listening to an audio tour. " +
            "Use only the requested language and do not mix languages. " +
            "Return only the narration text, without a title, numbered list, or explanation.";


        // 5. User prompt: provide the POI context and source description.
        var userPrompt = languageCode == "zh"
            ? $"目标语言：简体中文（普通话）。\n" +
            $"景点名称：{name}\n" +
            $"地点：{location}\n\n" +
            "请将下面的越南语资料改写为适合游客聆听的简体中文导览词。" +
            "在原文信息足够时，使用5到7个完整句子。" +
            "如果原文信息较少，可以使用较少的句子，不得重复内容或编造事实。" +
            "保留原文中的历史、建筑和文化信息。" +
            "只使用自然、流畅的简体中文，不要输出越南语、英语、日文假名或韩文。" +
            "只输出导览正文，不要添加标题、编号或解释。\n\n" +
            $"越南语原文：\n{description}"
            : $"Target language: {targetLanguage}\n" +
            $"Place name: {name}\n" +
            $"Location: {location}\n\n" +
            "Create a natural spoken tour narration based only on the source description below. " +
            "Aim for 5 to 7 complete sentences when the source contains enough distinct information. " +
            "For shorter sources, use fewer sentences rather than repeating ideas or inventing details. " +
            "Preserve all important facts and do not add unsupported information. " +
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

            "es" => "Rewrite the entire narration in natural Spanish. Use Spanish throughout and preserve the source facts.",
            "fr" => "Rewrite the entire narration in natural French. Use French throughout and preserve the source facts.",
            "de" => "Rewrite the entire narration in natural German. Use German throughout and preserve the source facts.",
            "ru" => "Rewrite the entire narration in natural Russian using Cyrillic. Preserve the source facts.",
            "th" => "Rewrite the entire narration in natural Thai using Thai script. Preserve the source facts.",

            _ => $"Rewrite entirely in {targetLanguage}."
        };

        for (var attempt = 1; attempt <= 2; attempt++)
        {
            var currentSystemPrompt = attempt == 1
                ? systemPrompt
                : systemPrompt + "\n\nIMPORTANT CORRECTION: " +
                retryInstruction +
                " Prioritize factual accuracy and preserve the source meaning. " +
                "Use 5 to 7 complete sentences only when supported by the source. " +
                "For shorter sources, use fewer sentences rather than repeating or inventing information. " +
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
        string language,
        string? requestedVoice,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(narrationText))
        {
            throw new ArgumentException(
                "Narration text must not be empty.",
                nameof(narrationText));
        }

        if (string.IsNullOrWhiteSpace(language))
        {
            throw new ArgumentException(
                "Ngôn ngữ thuyết minh không được để trống.",
                nameof(language));
        }

        var languageCode = NormalizeLanguage(language);

        // Piper voice availability is limited to the configured language models.
        // Never read unsupported languages using a voice from another language.
        if (languageCode is "ja" or "ko" or "th")
        {
            throw new NotSupportedException(
                $"Piper TTS chưa được cấu hình giọng đọc cho ngôn ngữ '{languageCode}'. " +
                "Hiện tại Piper hỗ trợ tiếng Việt, Anh, Trung, Tây Ban Nha, Pháp, Đức và Nga.");
        }

        var defaultVoice = languageCode switch
        {
            "vi" => _configuration["Piper:VietnameseVoice"]
                ?? "vi_VN-vais1000-medium",

            "en" => _configuration["Piper:EnglishVoice"]
                ?? "en_US-lessac-medium",

            "zh" => _configuration["Piper:ChineseVoice"]
                ?? "zh_CN-huayan-medium",

            "es" => _configuration["Piper:SpanishVoice"]
                ?? "es_ES-davefx-medium",

            "fr" => _configuration["Piper:FrenchVoice"]
                ?? "fr_FR-siwis-medium",

            "de" => _configuration["Piper:GermanVoice"]
                ?? "de_DE-thorsten-medium",

            "ru" => _configuration["Piper:RussianVoice"]
                ?? "ru_RU-denis-medium",

            _ => throw new InvalidOperationException(
                "Không tìm thấy giọng đọc phù hợp.")
        };

        // Accept a requested voice only when its locale matches the language.
        // Otherwise, use the configured default voice for that language.
        var requested = requestedVoice?.Trim();

        var voice = languageCode switch
        {
            "vi" when requested?.StartsWith(
                "vi_VN-", StringComparison.OrdinalIgnoreCase) == true
                => requested,

            "en" when requested?.StartsWith(
                "en_US-", StringComparison.OrdinalIgnoreCase) == true
                || requested?.StartsWith(
                    "en_GB-", StringComparison.OrdinalIgnoreCase) == true
                => requested,

            "zh" when requested?.StartsWith(
                "zh_CN-", StringComparison.OrdinalIgnoreCase) == true
                => requested,

            "es" when requested?.StartsWith(
                "es_ES-", StringComparison.OrdinalIgnoreCase) == true
                => requested,

            "fr" when requested?.StartsWith(
                "fr_FR-", StringComparison.OrdinalIgnoreCase) == true
                => requested,

            "de" when requested?.StartsWith(
                "de_DE-", StringComparison.OrdinalIgnoreCase) == true
                => requested,

            "ru" when requested?.StartsWith(
                "ru_RU-", StringComparison.OrdinalIgnoreCase) == true
                => requested,

            _ => defaultVoice
        };

        var baseUrl = GetPiperBaseUrl();

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{baseUrl}audio/speech");

        request.Content = JsonContent.Create(new
        {
            model = "piper",
            voice,
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
                $"Piper TTS thất bại (HTTP {(int)response.StatusCode}): " +
                GetSafeError(responseBody),
                null,
                response.StatusCode);
        }

        var audio = await response.Content.ReadAsByteArrayAsync(
            cancellationToken);

        if (audio.Length == 0)
        {
            throw new InvalidDataException(
                "Piper TTS trả về tệp âm thanh rỗng.");
        }

        return audio;
    }

    private static string NormalizeLanguage(string language)
    {
        if (string.IsNullOrWhiteSpace(language))
        {
            throw new ArgumentException(
                "Ngôn ngữ thuyết minh không được để trống.",
                nameof(language));
        }

        return language.Trim().ToLowerInvariant() switch
        {
            "vi" or "vi-vn" or "vietnamese" or "tiếng việt" => "vi",
            "en" or "en-us" or "en-gb" or "english" => "en",
            "zh" or "zh-cn" or "zh-tw" or "chinese" or "中文" => "zh",
            "ja" or "ja-jp" or "japanese" or "日本語" => "ja",
            "ko" or "ko-kr" or "korean" or "한국어" => "ko",
            "es" or "es-es" or "spanish" or "español" => "es",
            "fr" or "fr-fr" or "french" or "français" => "fr",
            "de" or "de-de" or "german" or "deutsch" => "de",
            "ru" or "ru-ru" or "russian" or "русский" => "ru",
            "th" or "th-th" or "thai" or "ไทย" => "th",

            _ => throw new ArgumentException(
                $"Ngôn ngữ thuyết minh không được hỗ trợ: {language}",
                nameof(language))
        };
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

        bool hasCyrillic = Regex.IsMatch(
            text,
            @"[\u0400-\u04FF]");

        bool hasThai = Regex.IsMatch(
            text,
            @"[\u0E00-\u0E7F]");

        bool hasVietnameseMarkers = Regex.IsMatch(
            text,
            @"\b(là|một|được|trong|này|và|của|với|có|đây|những|các|từ|đến|công trình|lịch sử|thành phố|du khách|tham quan|xây dựng|gắn liền|nơi đây)\b",
            RegexOptions.IgnoreCase);

        string code = languageCode.Trim().ToLowerInvariant();

        switch (code)
        {
            case "en":
            case "en-us":
            case "en-gb":
            case "english":
                return hasLatinLetters
                    && !hasHangul
                    && !hasKana
                    && !hasHan
                    && !hasCyrillic
                    && !hasThai
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
                    && !hasHan
                    && !hasCyrillic
                    && !hasThai;

            case "zh":
            case "zh-cn":
            case "zh-tw":
            case "chinese":
                return hasHan
                    && !hasHangul
                    && !hasKana
                    && !hasThai;

            case "ja":
            case "ja-jp":
            case "japanese":
                return hasKana
                    && !hasHangul
                    && !hasThai;

            case "ko":
            case "ko-kr":
            case "korean":
                return hasHangul
                    && !hasKana
                    && !hasThai;

            // Spanish, French and German share the Latin alphabet with English.
            // Require several language-specific function words so an English
            // response is less likely to pass validation accidentally.
            case "es":
            case "es-es":
            case "spanish":
                return HasLatinScriptOnly(text, hasLatinLetters, hasHangul,
                    hasKana, hasHan, hasCyrillic, hasThai, hasVietnameseMarkers)
                    && CountLanguageMarkers(text, new[]
                    {
                        "el", "la", "los", "las", "del", "que", "y", "en",
                        "un", "una", "unos", "unas", "por", "para", "con",
                        "se", "es", "está", "fue", "al"
                    }) >= 2;

            case "fr":
            case "fr-fr":
            case "french":
                return HasLatinScriptOnly(text, hasLatinLetters, hasHangul,
                    hasKana, hasHan, hasCyrillic, hasThai, hasVietnameseMarkers)
                    && CountLanguageMarkers(text, new[]
                    {
                        "le", "la", "les", "des", "du", "et", "est", "dans",
                        "une", "un", "pour", "avec", "qui", "au", "aux",
                        "sur", "cette", "ces", "son", "sa"
                    }) >= 2;

            case "de":
            case "de-de":
            case "german":
                return HasLatinScriptOnly(text, hasLatinLetters, hasHangul,
                    hasKana, hasHan, hasCyrillic, hasThai, hasVietnameseMarkers)
                    && CountLanguageMarkers(text, new[]
                    {
                        "der", "die", "das", "den", "dem", "des", "und", "ist",
                        "im", "in", "ein", "eine", "mit", "von", "zu", "auf",
                        "für", "als", "am", "an"
                    }) >= 2;

            case "ru":
            case "ru-ru":
            case "russian":
                return hasCyrillic
                    && !hasHangul
                    && !hasKana
                    && !hasThai;

            case "th":
            case "th-th":
            case "thai":
                return hasThai
                    && !hasHangul
                    && !hasKana
                    && !hasHan
                    && !hasCyrillic;

            default:
                return false;
        }
    }

    private static bool HasLatinScriptOnly(
        string text,
        bool hasLatinLetters,
        bool hasHangul,
        bool hasKana,
        bool hasHan,
        bool hasCyrillic,
        bool hasThai,
        bool hasVietnameseMarkers)
    {
        return hasLatinLetters
            && !hasHangul
            && !hasKana
            && !hasHan
            && !hasCyrillic
            && !hasThai
            && !hasVietnameseMarkers;
    }

    private static int CountLanguageMarkers(
        string text,
        string[] markers)
    {
        var words = Regex.Matches(text.ToLowerInvariant(), @"[\p{L}]+")
            .Select(match => match.Value)
            .ToHashSet(StringComparer.Ordinal);

        return markers.Count(words.Contains);
    }

    // =========================================================
    // CONFIGURATION HELPERS
    // =========================================================

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
    private string GetPiperBaseUrl()
    {
        var baseUrl = _configuration["Piper:BaseUrl"]
            ?? "http://piper-tts:5000/v1/";

        return baseUrl.EndsWith('/')
            ? baseUrl
            : baseUrl + "/";
    }
}
