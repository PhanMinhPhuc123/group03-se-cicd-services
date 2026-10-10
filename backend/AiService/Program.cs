using AiService.Data;
using AiService.Messaging;
using AiService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// PostgreSQL
builder.Services.AddDbContext<AiDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// RabbitMQ
builder.Services.AddSingleton<RabbitMqConnection>();

// MinIO
builder.Services.AddSingleton<MinioService>();

// Controller
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Bật Swagger khi cần kiểm tra API
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseAuthorization();

// Cho phép sử dụng các Controller
app.MapControllers();

// Test kết nối RabbitMQ
using (var scope = app.Services.CreateScope())
{
    var rabbitMq = scope.ServiceProvider
        .GetRequiredService<RabbitMqConnection>();

    await rabbitMq.TestConnectionAsync();

    var minio = scope.ServiceProvider
        .GetRequiredService<MinioService>();

    await minio.TestConnectionAsync();
}
app.Run();