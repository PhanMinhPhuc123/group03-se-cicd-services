
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using PoiService.Data;
using PoiService.Services;
using Minio;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CONTROLLERS
// ==========================================
builder.Services.AddControllers();

// ==========================================
// 2. DATABASE - PostgreSQL
// ==========================================
builder.Services.AddDbContext<PoiDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));


// ==========================================
// 2.1. MINIO - LƯU TRỮ ẢNH ĐỊA ĐIỂM
// ==========================================
builder.Services.AddSingleton<IMinioClient>(serviceProvider =>
{
    var configuration =
        serviceProvider.GetRequiredService<IConfiguration>();

    var endpoint = configuration["Minio:Endpoint"];
    var accessKey = configuration["Minio:AccessKey"];
    var secretKey = configuration["Minio:SecretKey"];
    var useSSL = configuration.GetValue<bool>("Minio:UseSSL");

    if (string.IsNullOrWhiteSpace(endpoint) ||
        string.IsNullOrWhiteSpace(accessKey) ||
        string.IsNullOrWhiteSpace(secretKey))
    {
        throw new InvalidOperationException(
            "Thiếu cấu hình kết nối MinIO của PoiService.");
    }

    var client = new MinioClient()
        .WithEndpoint(endpoint)
        .WithCredentials(accessKey, secretKey);

    if (useSSL)
    {
        client = client.WithSSL();
    }

    return client.Build();
});

// ==========================================
// 3. VISITOR SESSION CLEANUP
// ==========================================
builder.Services.AddHostedService<VisitSessionCleanupService>();

// ==========================================
// 4. JWT CONFIGURATION
// ==========================================
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey) ||
    string.IsNullOrWhiteSpace(jwtIssuer) ||
    string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "Thiếu cấu hình JWT của PoiService.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ==========================================
// 5. SWAGGER + JWT BEARER AUTHENTICATION
// ==========================================
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PoiService",
        Version = "1.0"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token được cấp bởi AuthService."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] =
                new List<string>()
        });
});

// ==========================================
// 6. CORS - REACT FRONTEND
// ==========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ==========================================
// 7. BUILD APPLICATION
// ==========================================
var app = builder.Build();

// ==========================================
// 8. SWAGGER MIDDLEWARE
// ==========================================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSwagger();
app.UseSwaggerUI();

// ==========================================
// 9. MIDDLEWARE PIPELINE
// ==========================================
app.UseCors("AllowReactFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// ==========================================
// 10. MAP CONTROLLERS
// ==========================================
app.MapControllers();

// ==========================================
// 11. RUN APPLICATION
// ==========================================
app.Run();
