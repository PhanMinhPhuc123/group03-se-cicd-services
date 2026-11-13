
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
        ?? "http://host.docker.internal:5252/";

    client.BaseAddress = new Uri(
        baseUrl.EndsWith('/') ? baseUrl : baseUrl + "/");

    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient<NarrationGenerationService>(client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
});

// Rate limiting
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
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();

var app = builder.Build();

// Check database connection
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AiDbContext>();

    if (await db.Database.CanConnectAsync())
    {
        Console.WriteLine("Connected to ai_db successfully.");
    }
    else
    {
        throw new InvalidOperationException(
            "Cannot connect to ai_db. Please check the connection string.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database connection failed: {ex.Message}");
    throw;
}

// ai_db.sql is the source of truth.
// Never run EF migrations automatically here.
app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();

app.Run();
