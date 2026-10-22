
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
builder.Services.AddHostedService<PoiEventConsumerService>();

// MinIO
builder.Services.AddSingleton<MinioService>();

// Controller
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Kiểm tra kết nối RabbitMQ và MinIO
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
