
using PoiService.Data;

namespace PoiService.Services;

public sealed class VisitSessionCleanupService : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Không tự động đóng phiên theo thời gian.
        // Phiên chỉ kết thúc khi người dùng gọi API /end.
        return Task.CompletedTask;
    }
}
