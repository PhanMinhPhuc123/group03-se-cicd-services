
using AiService.Models;
using Microsoft.EntityFrameworkCore;

namespace AiService.Data;

public class AiDbContext : DbContext
{
    public AiDbContext(DbContextOptions<AiDbContext> options)
        : base(options)
    {
    }

    // Bang luu thong tin POI dong bo tu PoiService
    public DbSet<PoiRecord> PoiRecords => Set<PoiRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PoiRecord>(entity =>
        {
            entity.ToTable("PoiRecords");

            // Su dung ma POI tu PoiService, khong tu tang
            entity.HasKey(p => p.PoiId);
            entity.Property(p => p.PoiId).ValueGeneratedNever();

            entity.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(p => p.Description)
                .IsRequired();

            entity.Property(p => p.Location)
                .IsRequired()
                .HasMaxLength(500);
        });
    }
}
