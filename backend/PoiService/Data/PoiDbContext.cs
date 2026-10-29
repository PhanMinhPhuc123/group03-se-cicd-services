
using Microsoft.EntityFrameworkCore;
using PoiService.Models;

namespace PoiService.Data;

public class PoiDbContext : DbContext
{
    public PoiDbContext(DbContextOptions<PoiDbContext> options)
        : base(options)
    {
    }

    // Các bảng hiện có.
    public DbSet<AccessCode> AccessCodes { get; set; }
    public DbSet<POI> POIs { get; set; }
    public DbSet<Tour> Tours { get; set; }
    public DbSet<TourPOI> TourPOIs { get; set; }

    // Bảng lưu các phiên trải nghiệm của khách.
    public DbSet<VisitSession> VisitSessions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Mỗi AccessCode thuộc một Tour.
        modelBuilder.Entity<AccessCode>()
            .HasOne(a => a.Tour)
            .WithMany(t => t.AccessCodes)
            .HasForeignKey(a => a.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        // Khóa chính kết hợp của bảng TourPOI.
        modelBuilder.Entity<TourPOI>()
            .HasKey(tp => new { tp.TourId, tp.POIId });

        // Quan hệ giữa TourPOI và Tour.
        modelBuilder.Entity<TourPOI>()
            .HasOne(tp => tp.Tour)
            .WithMany()
            .HasForeignKey(tp => tp.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        // Quan hệ giữa TourPOI và POI.
        modelBuilder.Entity<TourPOI>()
            .HasOne(tp => tp.POI)
            .WithMany()
            .HasForeignKey(tp => tp.POIId)
            .OnDelete(DeleteBehavior.Cascade);

        // Cấu hình bảng VisitSessions.
        modelBuilder.Entity<VisitSession>(entity =>
        {
            entity.HasKey(x => x.Id);

            // Hỗ trợ truy vấn theo thời điểm bắt đầu.
            entity.HasIndex(x => x.EntryTime);

            // Hỗ trợ truy vấn theo địa điểm.
            entity.HasIndex(x => x.POIId);

            // Hỗ trợ tìm các phiên không hoạt động trong thời gian dài.
            entity.HasIndex(x => x.LastActivityAt);

            // Phiên vẫn được giữ nếu POI bị xóa.
            // Khi đó POIId sẽ được đặt thành null.
            entity.HasOne(x => x.POI)
                .WithMany()
                .HasForeignKey(x => x.POIId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
