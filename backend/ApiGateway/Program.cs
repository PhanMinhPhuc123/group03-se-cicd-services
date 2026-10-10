
var builder = WebApplication.CreateBuilder(args);

// Đọc cấu hình Reverse Proxy từ appsettings.json
builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.MapReverseProxy();

app.Run();
