using Microsoft.EntityFrameworkCore;
using PoiService.Models;

namespace PoiService.Data;

public class PoiDbContext : DbContext
{
    public PoiDbContext(DbContextOptions<PoiDbContext> options)
        : base(options)
    {
    }

    public DbSet<AccessCode> AccessCodes { get; set; }

    public DbSet<POI> POIs { get; set; }

    public DbSet<Tour> Tours { get; set; }

    public DbSet<TourPOI> TourPOIs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // AccessCode → Tour
        modelBuilder.Entity<AccessCode>()
            .HasOne(a => a.Tour)
            .WithMany(t => t.AccessCodes)
            .HasForeignKey(a => a.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        // TourPOI là bảng trung gian giữa Tour và POI
        modelBuilder.Entity<TourPOI>()
            .HasKey(tp => new { tp.TourId, tp.POIId });

        // Tour → TourPOI
        modelBuilder.Entity<TourPOI>()
            .HasOne(tp => tp.Tour)
            .WithMany()
            .HasForeignKey(tp => tp.TourId)
            .OnDelete(DeleteBehavior.Cascade);

        // POI → TourPOI
        modelBuilder.Entity<TourPOI>()
            .HasOne(tp => tp.POI)
            .WithMany()
            .HasForeignKey(tp => tp.POIId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}