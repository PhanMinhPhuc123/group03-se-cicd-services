using AiService.Models;
using Microsoft.EntityFrameworkCore;

namespace AiService.Data;

/// <summary>
/// EF mapping for the four AI tables in ai_db.sql.
/// POI and visitor-session identifiers are logical references to poi_db;
/// no cross-database foreign keys or mirrored POI table are created here.
/// </summary>
public sealed class AiDbContext : DbContext
{
    public AiDbContext(DbContextOptions<AiDbContext> options) : base(options) { }

    public DbSet<Language> Languages => Set<Language>();
    public DbSet<NarrationRequest> NarrationRequests => Set<NarrationRequest>();
    public DbSet<NarrationContent> NarrationContents => Set<NarrationContent>();
    public DbSet<AudioFile> AudioFiles => Set<AudioFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Language>(entity =>
        {
            entity.ToTable("languages");
            entity.HasKey(x => x.LanguageCode);
            entity.Property(x => x.LanguageCode).HasColumnName("language_code").HasMaxLength(10);
            entity.Property(x => x.LanguageName).HasColumnName("language_name").HasMaxLength(100).IsRequired();
            entity.Property(x => x.PiperVoice).HasColumnName("piper_voice").HasMaxLength(255).IsRequired();
            entity.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone");
        });

        modelBuilder.Entity<NarrationContent>(entity =>
        {
            entity.ToTable("narration_contents");
            entity.HasKey(x => x.ContentId);
            entity.Property(x => x.ContentId).HasColumnName("content_id").ValueGeneratedNever();
            entity.Property(x => x.PoiId).HasColumnName("poi_id");
            entity.Property(x => x.LanguageCode).HasColumnName("language_code").HasMaxLength(10).IsRequired();
            entity.Property(x => x.SourceHash).HasColumnName("source_hash").HasMaxLength(64).IsRequired();
            entity.Property(x => x.GeneratedText).HasColumnName("generated_text").HasColumnType("text").IsRequired();
            entity.Property(x => x.ModelName).HasColumnName("model_name").HasMaxLength(150).IsRequired();
            entity.Property(x => x.PromptVersion).HasColumnName("prompt_version").HasMaxLength(50).IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.HasIndex(x => new { x.PoiId, x.LanguageCode, x.SourceHash, x.PromptVersion })
                .IsUnique().HasDatabaseName("uq_narration_contents_source");
            entity.HasIndex(x => new { x.PoiId, x.LanguageCode, x.IsActive })
                .HasDatabaseName("ix_narration_contents_poi_language");
            entity.HasOne(x => x.Language)
                .WithMany(x => x.NarrationContents)
                .HasForeignKey(x => x.LanguageCode)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<NarrationRequest>(entity =>
        {
            entity.ToTable("narration_requests", table =>
            {
                table.HasCheckConstraint("ck_narration_requests_status",
                    "status IN ('pending', 'processing', 'success', 'failed')");
                table.HasCheckConstraint("ck_narration_requests_retry_count",
                    "retry_count >= 0");
            });
            entity.HasKey(x => x.RequestId);
            entity.Property(x => x.RequestId).HasColumnName("request_id").ValueGeneratedNever();
            entity.Property(x => x.PoiId).HasColumnName("poi_id");
            entity.Property(x => x.SessionId).HasColumnName("session_id");
            entity.Property(x => x.LanguageCode).HasColumnName("language_code").HasMaxLength(10).IsRequired();
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(30).IsRequired();
            entity.Property(x => x.IdempotencyKey).HasColumnName("idempotency_key");
            entity.Property(x => x.NarrationContentId).HasColumnName("narration_content_id");
            entity.Property(x => x.RequestedAt).HasColumnName("requested_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.StartedAt).HasColumnName("started_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.CompletedAt).HasColumnName("completed_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone");
            entity.Property(x => x.RetryCount).HasColumnName("retry_count").HasDefaultValue(0);
            entity.Property(x => x.ErrorCode).HasColumnName("error_code").HasMaxLength(100);
            entity.Property(x => x.ErrorMessage).HasColumnName("error_message").HasColumnType("text");
            entity.HasIndex(x => x.IdempotencyKey).IsUnique()
                .HasDatabaseName("ux_narration_requests_idempotency_key");
            entity.HasIndex(x => new { x.PoiId, x.LanguageCode, x.RequestedAt })
                .HasDatabaseName("ix_narration_requests_poi_language")
                .IsDescending(false, false, true);
            entity.HasIndex(x => x.SessionId).HasDatabaseName("ix_narration_requests_session");
            entity.HasIndex(x => x.Status).HasDatabaseName("ix_narration_requests_status");
            entity.HasOne(x => x.Language)
                .WithMany(x => x.NarrationRequests)
                .HasForeignKey(x => x.LanguageCode)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.NarrationContent)
                .WithMany(x => x.NarrationRequests)
                .HasForeignKey(x => x.NarrationContentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AudioFile>(entity =>
        {
            entity.ToTable("audio_files", table =>
            {
                table.HasCheckConstraint("ck_audio_files_duration",
                    "duration_seconds IS NULL OR duration_seconds >= 0");
                table.HasCheckConstraint("ck_audio_files_size",
                    "size_bytes IS NULL OR size_bytes >= 0");
            });
            entity.HasKey(x => x.AudioId);
            entity.Property(x => x.AudioId).HasColumnName("audio_id").ValueGeneratedNever();
            entity.Property(x => x.ContentId).HasColumnName("content_id");
            entity.Property(x => x.BucketName).HasColumnName("bucket_name").HasMaxLength(255).IsRequired();
            entity.Property(x => x.ObjectKey).HasColumnName("object_key").HasMaxLength(500).IsRequired();
            entity.Property(x => x.ContentType).HasColumnName("content_type").HasMaxLength(100).IsRequired();
            entity.Property(x => x.DurationSeconds).HasColumnName("duration_seconds").HasPrecision(10, 2);
            entity.Property(x => x.SizeBytes).HasColumnName("size_bytes");
            entity.Property(x => x.TtsVoice).HasColumnName("tts_voice").HasMaxLength(255).IsRequired();
            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone");
            entity.HasIndex(x => x.ContentId).IsUnique().HasDatabaseName("ux_audio_files_content_id");
            entity.HasIndex(x => x.ObjectKey).IsUnique().HasDatabaseName("ux_audio_files_object_key");
            entity.HasOne(x => x.NarrationContent)
                .WithOne(x => x.AudioFile)
                .HasForeignKey<AudioFile>(x => x.ContentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
