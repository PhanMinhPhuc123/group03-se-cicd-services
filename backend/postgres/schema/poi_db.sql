
-- CNPM2 authoritative schema: poi_db
-- Run against database poi_db only.
-- Cross-database admin references are logical UUIDs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. TABLE: pois
-- =====================================================

CREATE TABLE IF NOT EXISTS pois (
    poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_search TEXT NOT NULL,
    address VARCHAR(500) NOT NULL,
    address_search TEXT NOT NULL,
    description TEXT NULL,
    image_url TEXT NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_admin_id UUID NULL,
    updated_by_admin_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_pois_latitude_range
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT ck_pois_longitude_range
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

    CONSTRAINT ck_pois_coordinate_pair
        CHECK ((latitude IS NULL) = (longitude IS NULL)),

    CONSTRAINT ck_pois_name_nonempty
        CHECK (length(trim(name)) > 0),

    CONSTRAINT ck_pois_address_nonempty
        CHECK (length(trim(address)) > 0)
);

-- =====================================================
-- 2. TABLE: tours
-- =====================================================

CREATE TABLE IF NOT EXISTS tours (
    tour_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_admin_id UUID NULL,
    updated_by_admin_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL
);

-- =====================================================
-- 3. TABLE: tour_pois
-- =====================================================

CREATE TABLE IF NOT EXISTS tour_pois (
    tour_id UUID NOT NULL,
    poi_id UUID NOT NULL,
    display_order INTEGER NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_tour_pois
        PRIMARY KEY (tour_id, poi_id),

    CONSTRAINT fk_tour_pois_tours
        FOREIGN KEY (tour_id)
        REFERENCES tours(tour_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_tour_pois_pois
        FOREIGN KEY (poi_id)
        REFERENCES pois(poi_id)
        ON DELETE RESTRICT
);

-- =====================================================
-- 4. TABLE: visitor_sessions
-- =====================================================

CREATE TABLE IF NOT EXISTS visitor_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NULL,
    ended_at TIMESTAMPTZ NULL,
    device_name VARCHAR(255) NULL,
    user_agent TEXT NULL,
    ip_address INET NULL,
    ui_language_code VARCHAR(10) NULL,
    selected_poi_name VARCHAR(255) NULL,
    gps_status VARCHAR(30) NOT NULL DEFAULT 'not_requested',
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    gps_consent_at TIMESTAMPTZ NULL,
    gps_updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_visitor_sessions_gps_status
        CHECK (
            gps_status IN (
                'not_requested',
                'granted',
                'denied',
                'unavailable',
                'error'
            )
        ),

    CONSTRAINT ck_visitor_sessions_latitude_range
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT ck_visitor_sessions_longitude_range
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

    CONSTRAINT ck_visitor_sessions_coordinate_pair
        CHECK ((latitude IS NULL) = (longitude IS NULL)),

    CONSTRAINT ck_visitor_sessions_granted_coordinates
        CHECK (
            gps_status <> 'granted'
            OR (latitude IS NOT NULL AND longitude IS NOT NULL)
        ),

    CONSTRAINT ck_visitor_sessions_coordinates_only_when_granted
        CHECK (
            gps_status = 'granted'
            OR (latitude IS NULL AND longitude IS NULL)
        )
);

-- =====================================================
-- 5. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS ix_pois_name_search
    ON pois USING GIN (to_tsvector('simple', name_search));

CREATE INDEX IF NOT EXISTS ix_pois_address_search
    ON pois USING GIN (to_tsvector('simple', address_search));

CREATE INDEX IF NOT EXISTS ix_tour_pois_display_order
    ON tour_pois (tour_id, display_order);

CREATE INDEX IF NOT EXISTS ix_visitor_sessions_started_at
    ON visitor_sessions (started_at);

CREATE INDEX IF NOT EXISTS ix_visitor_sessions_last_active_at
    ON visitor_sessions (last_active_at);

CREATE INDEX IF NOT EXISTS ix_visitor_sessions_gps_status
    ON visitor_sessions (gps_status);
