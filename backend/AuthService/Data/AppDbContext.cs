
using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.ToTable("admin_users", "public");

            entity.HasKey(x => x.AdminId);

            entity.Property(x => x.AdminId)
                .HasColumnName("admin_id")
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(x => x.Username)
                .HasColumnName("username")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.PasswordHash)
                .HasColumnName("password_hash")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(x => x.DisplayName)
                .HasColumnName("display_name")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.IsActive)
                .HasColumnName("is_active")
                .HasDefaultValue(true);

            entity.Property(x => x.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired();

            entity.Property(x => x.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("timestamp with time zone");

            entity.Property(x => x.LastLoginAt)
                .HasColumnName("last_login_at")
                .HasColumnType("timestamp with time zone");
        });
    }
}
