
using System.Reflection;
using System.Threading.RateLimiting;
using AiService.Data;
using AiService.Services;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Missing ConnectionStrings:DefaultConnection.");
}

builder.Services.AddDbContext<AiDbContext>(options =>
    options.UseNpgsql(connectionString));

// AI integrations
builder.Services.AddSingleton<MinioService>();

builder.Services.AddHttpClient<PoiServiceClient>(client =>
{
    var baseUrl = builder.Configuration["PoiService:BaseUrl"]
        ?? "http://app_poiservice:8080/";

    client.BaseAddress = new Uri(
        baseUrl.EndsWith('/') ? baseUrl : baseUrl + "/");

    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<NarrationGenerationService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
});

// Short-timeout clients used only by the Health API.
static string NormalizeBaseUrl(string? configuredUrl, string fallback)
{
    var value = string.IsNullOrWhiteSpace(configuredUrl)
        ? fallback
        : configuredUrl.Trim();

    return value.EndsWith('/') ? value : value + "/";
}

var minioEndpoint = builder.Configuration["MinIO:Endpoint"] ?? "minio:9000";
var minioUseSsl = bool.TryParse(
    builder.Configuration["MinIO:UseSSL"], out var parsedSsl) && parsedSsl;

var minioBaseUrl = minioEndpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                   minioEndpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
    ? NormalizeBaseUrl(minioEndpoint, "http://minio:9000/")
    : NormalizeBaseUrl(
        $"{(minioUseSsl ? "https" : "http")}://{minioEndpoint}",
        "http://minio:9000/");

builder.Services.AddHttpClient("MinioHealth", client =>
{
    client.BaseAddress = new Uri(minioBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
});

builder.Services.AddHttpClient("OllamaHealth", client =>
{
    var baseUrl = NormalizeBaseUrl(
        builder.Configuration["Ollama:BaseUrl"],
        "http://host.docker.internal:11434/v1/");

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
});

builder.Services.AddHttpClient("PiperHealth", client =>
{
    var baseUrl = NormalizeBaseUrl(
        builder.Configuration["Piper:BaseUrl"],
        "http://piper-tts:5000/v1/");

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
});

builder.Services.AddHttpClient("PoiServiceHealth", client =>
{
    var baseUrl = NormalizeBaseUrl(
        builder.Configuration["PoiService:BaseUrl"],
        "http://app_poiservice:8080/");

    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
});

// Rate limiting: 10 narration requests per minute per IP.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("ai-narration", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Do not fail startup when PostgreSQL is temporarily unavailable.
// /api/ai/health reports dependency readiness instead.
// ai_db.sql is the source of truth.
// Never run EF migrations automatically here.

app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();

app.Run();
