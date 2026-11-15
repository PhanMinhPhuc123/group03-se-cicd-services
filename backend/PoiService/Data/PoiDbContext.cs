
using Microsoft.EntityFrameworkCore;
using PoiService.Models;

namespace PoiService.Data;

public class PoiDbContext : DbContext
{
    public PoiDbContext(DbContextOptions<PoiDbContext> options)
        : base(options) { }

    public DbSet<POI> POIs => Set<POI>();
    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<TourPOI> TourPOIs => Set<TourPOI>();
    public DbSet<VisitSession> VisitSessions => Set<VisitSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<POI>(entity =>
        {
            entity.ToTable("pois");
            entity.HasKey(x => x.PoiId);

            entity.Property(x => x.PoiId).HasColumnName("poi_id");
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.NameSearch).HasColumnName("name_search").HasColumnType("text").IsRequired();
            entity.Property(x => x.Address).HasColumnName("address").HasMaxLength(500).IsRequired();
            entity.Property(x => x.AddressSearch).HasColumnName("address_search").HasColumnType("text").IsRequired();
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            entity.Property(x => x.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            entity.Property(x => x.IsVisible).HasColumnName("is_visible").HasDefaultValue(true);
            entity.Property(x => x.CreatedByAdminId).HasColumnName("created_by_admin_id");
            entity.Property(x => x.UpdatedByAdminId).HasColumnName("updated_by_admin_id");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone");
        });

        modelBuilder.Entity<Tour>(entity =>
        {
            entity.ToTable("tours");
            entity.HasKey(x => x.TourId);

            entity.Property(x => x.TourId).HasColumnName("tour_id");
            entity.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.Description).HasColumnName("description");
            entity.Property(x => x.IsVisible).HasColumnName("is_visible").HasDefaultValue(true);
            entity.Property(x => x.CreatedByAdminId).HasColumnName("created_by_admin_id");
            entity.Property(x => x.UpdatedByAdminId).HasColumnName("updated_by_admin_id");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone");
        });

        modelBuilder.Entity<TourPOI>(entity =>
        {
            entity.ToTable("tour_pois");
            entity.HasKey(x => new { x.TourId, x.PoiId });

            entity.Property(x => x.TourId).HasColumnName("tour_id");
            entity.Property(x => x.PoiId).HasColumnName("poi_id");
            entity.Property(x => x.DisplayOrder).HasColumnName("display_order");
            entity.Property(x => x.AddedAt).HasColumnName("added_at").HasColumnType("timestamp with time zone");

            entity.HasOne(x => x.Tour)
                .WithMany(x => x.TourPOIs)
                .HasForeignKey(x => x.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.POI)
                .WithMany()
                .HasForeignKey(x => x.PoiId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<VisitSession>(entity =>
        {
            entity.ToTable("visitor_sessions", table =>
            {
                table.HasCheckConstraint(
                    "ck_visitor_sessions_gps_status",
                    "gps_status IN ('not_requested', 'granted', 'denied', 'unavailable', 'error')");

                table.HasCheckConstraint(
                    "ck_visitor_sessions_coordinates_pair",
                    "(latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)");

                table.HasCheckConstraint(
                    "ck_visitor_sessions_gps_granted_requires_coordinates",
                    "gps_status <> 'granted' OR (latitude IS NOT NULL AND longitude IS NOT NULL)");

                table.HasCheckConstraint(
                    "ck_visitor_sessions_coordinates_require_granted",
                    "gps_status = 'granted' OR (latitude IS NULL AND longitude IS NULL)");
            });

            entity.HasKey(x => x.SessionId);
            entity.Property(x => x.SessionId).HasColumnName("session_id");
            entity.Property(x => x.StartedAt).HasColumnName("started_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.LastActiveAt).HasColumnName("last_active_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.EndedAt).HasColumnName("ended_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.DeviceName).HasColumnName("device_name").HasMaxLength(255);
            entity.Property(x => x.UserAgent).HasColumnName("user_agent").HasColumnType("text");
            entity.Property(x => x.IpAddress).HasColumnName("ip_address").HasColumnType("inet");
            entity.Property(x => x.UiLanguageCode).HasColumnName("ui_language_code").HasMaxLength(10);
            entity.Property(x => x.GpsStatus).HasColumnName("gps_status").HasMaxLength(30).HasDefaultValue("not_requested");
            entity.Property(x => x.Latitude).HasColumnName("latitude").HasPrecision(10, 7);
            entity.Property(x => x.Longitude).HasColumnName("longitude").HasPrecision(10, 7);
            entity.Property(x => x.GpsConsentAt).HasColumnName("gps_consent_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.GpsUpdatedAt).HasColumnName("gps_updated_at").HasColumnType("timestamp with time zone");

            entity.HasIndex(x => x.StartedAt);
            entity.HasIndex(x => x.LastActiveAt);
        });
    }
}
