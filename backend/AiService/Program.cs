
using AiService.Data;
using AiService.Messaging;
using AiService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Không tìm thấy ConnectionStrings:DefaultConnection.");
}

var connectionBuilder =
    new Npgsql.NpgsqlConnectionStringBuilder(connectionString);

Console.WriteLine($"PostgreSQL Host: {connectionBuilder.Host}");
Console.WriteLine($"PostgreSQL Port: {connectionBuilder.Port}");
Console.WriteLine($"PostgreSQL Database: {connectionBuilder.Database}");
Console.WriteLine($"PostgreSQL Username: {connectionBuilder.Username}");
Console.WriteLine($"PostgreSQL Password có được cấu hình: {!string.IsNullOrEmpty(connectionBuilder.Password)}");

// Đăng ký kết nối PostgreSQL.
builder.Services.AddDbContext<AiDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// Đăng ký dịch vụ kết nối RabbitMQ.
builder.Services.AddSingleton<RabbitMqConnection>();

// Khởi chạy consumer để nhận sự kiện POI từ RabbitMQ.
builder.Services.AddHostedService<PoiEventConsumerService>();

// Đăng ký dịch vụ MinIO để kiểm tra kết nối và quản lý tệp.
builder.Services.AddSingleton<MinioService>();

// Đăng ký dịch vụ tạo nội dung thuyết minh bằng AI.
builder.Services.AddHttpClient<OpenAiNarrationService>();

// Đăng ký Controller để tạo các API cho AiService.
builder.Services.AddControllers();

// Đăng ký Swagger để kiểm thử API trên trình duyệt.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Bật Swagger và giao diện Swagger UI để kiểm tra API.
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
// Bật xác thực quyền truy cập nếu các API sử dụng authorization.
app.UseAuthorization();

// Ánh xạ các Controller thành API endpoint.
app.MapControllers();

// Kiểm tra kết nối RabbitMQ và MinIO khi ứng dụng khởi động.
using (var scope = app.Services.CreateScope())
{
    var rabbitMq = scope.ServiceProvider
        .GetRequiredService<RabbitMqConnection>();

    await rabbitMq.TestConnectionAsync();

    var minio = scope.ServiceProvider
        .GetRequiredService<MinioService>();

    await minio.TestConnectionAsync();
}

// Khởi chạy ứng dụng.
app.Run();
