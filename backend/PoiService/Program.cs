using PoiService.Messaging;
using Microsoft.EntityFrameworkCore;
using PoiService.Data;

var builder = WebApplication.CreateBuilder(args);

// Đăng ký các Controller để xử lý API.
builder.Services.AddControllers();

// Cấu hình kết nối PostgreSQL.
builder.Services.AddDbContext<PoiDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Đăng ký RabbitMQ Publisher.
builder.Services.AddSingleton<RabbitMqPublisher>();

// Cấu hình OpenAPI.
builder.Services.AddOpenApi();

// Cấu hình Swagger.
builder.Services.AddSwaggerGen();

// Cấu hình CORS cho phép frontend React gọi API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Cấu hình OpenAPI khi chạy môi trường Development.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Bật giao diện Swagger.
app.UseSwagger();
app.UseSwaggerUI();

// Cho phép frontend React gọi API.
app.UseCors("AllowReactFrontend");

// Giữ nguyên cấu hình HTTPS của dự án.
app.UseHttpsRedirection();

// Kiểm tra quyền truy cập.
app.UseAuthorization();

// Ánh xạ các Controller thành API endpoints.
app.MapControllers();

app.Run();