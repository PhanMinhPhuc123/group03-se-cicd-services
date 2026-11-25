-- CNPM2 authoritative schema: ai_db
-- Run against database ai_db only. poi_id/session_id are logical cross-database UUID references.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS languages (
    language_code VARCHAR(10) PRIMARY KEY,
    language_name VARCHAR(100) NOT NULL,
    piper_voice VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS narration_contents (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    source_hash VARCHAR(64) NOT NULL,
    generated_text TEXT NOT NULL,
    model_name VARCHAR(150) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_narration_contents_languages FOREIGN KEY (language_code) REFERENCES languages(language_code),
    CONSTRAINT uq_narration_contents_source UNIQUE (poi_id, language_code, source_hash, prompt_version)
);

CREATE TABLE IF NOT EXISTS narration_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID NOT NULL,
    session_id UUID NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL,
    idempotency_key UUID NOT NULL UNIQUE,
    narration_content_id UUID NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_code VARCHAR(100) NULL,
    error_message TEXT NULL,
    CONSTRAINT fk_narration_requests_languages FOREIGN KEY (language_code) REFERENCES languages(language_code),
    CONSTRAINT fk_narration_requests_contents FOREIGN KEY (narration_content_id) REFERENCES narration_contents(content_id),
    CONSTRAINT ck_narration_requests_status CHECK (status IN ('pending','processing','success','failed')),
    CONSTRAINT ck_narration_requests_retry_count CHECK (retry_count >= 0)
);

CREATE TABLE IF NOT EXISTS audio_files (
    audio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL UNIQUE,
    bucket_name VARCHAR(255) NOT NULL,
    object_key VARCHAR(500) NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    duration_seconds DECIMAL(10,2) NULL,
    size_bytes BIGINT NULL,
    tts_voice VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audio_files_contents FOREIGN KEY (content_id) REFERENCES narration_contents(content_id),
    CONSTRAINT ck_audio_files_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT ck_audio_files_size CHECK (size_bytes IS NULL OR size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS ix_narration_requests_poi_language ON narration_requests (poi_id, language_code, requested_at DESC);
CREATE INDEX IF NOT EXISTS ix_narration_requests_session ON narration_requests (session_id);
CREATE INDEX IF NOT EXISTS ix_narration_requests_status ON narration_requests (status);
CREATE INDEX IF NOT EXISTS ix_narration_contents_poi_language ON narration_contents (poi_id, language_code, is_active);


-- Seed 10 languages for CNPM2.
-- Only activate languages with a voice model currently configured.
INSERT INTO languages (
    language_code,
    language_name,
    piper_voice,
    is_active
)
VALUES
    ('vi-VN', 'Tiếng Việt', 'vi_VN-vais1000-medium', TRUE),
    ('en-US', 'English', 'en_US-lessac-medium', TRUE),
    ('zh-CN', '中文', 'zh_CN-huayan-medium', TRUE),
    ('ko-KR', '한국어', 'PENDING_KOREAN_VOICE_MODEL', FALSE),
    ('ja-JP', '日本語', 'PENDING_JAPANESE_VOICE_MODEL', FALSE),
    ('es-ES', 'Español', 'PENDING_SPANISH_VOICE_MODEL', FALSE),
    ('fr-FR', 'Français', 'PENDING_FRENCH_VOICE_MODEL', FALSE),
    ('de-DE', 'Deutsch', 'PENDING_GERMAN_VOICE_MODEL', FALSE),
    ('ru-RU', 'Русский', 'PENDING_RUSSIAN_VOICE_MODEL', FALSE),
    ('th-TH', 'ไทย', 'PENDING_THAI_VOICE_MODEL', FALSE)
ON CONFLICT (language_code) DO UPDATE SET
    language_name = EXCLUDED.language_name,
    piper_voice = EXCLUDED.piper_voice,
    is_active = EXCLUDED.is_active;
