
using Microsoft.EntityFrameworkCore;
using PoiService.Data;

namespace PoiService.Services;

public sealed class VisitSessionCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VisitSessionCleanupService> _logger;

    public VisitSessionCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<VisitSessionCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<PoiDbContext>();

                var now = DateTime.UtcNow;
                var timeout = now.AddMinutes(-30);

                var affected = await db.VisitSessions
                    .Where(s => s.EndedAt == null &&
                                s.LastActiveAt != null &&
                                s.LastActiveAt < timeout)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(s => s.EndedAt, s => s.LastActiveAt!.Value.AddMinutes(30)),
                        stoppingToken);

                if (affected > 0)
                    _logger.LogInformation(
                        "Đã tự đóng {Count} phiên không hoạt động quá 30 phút.",
                        affected);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tự đóng phiên tham quan.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
