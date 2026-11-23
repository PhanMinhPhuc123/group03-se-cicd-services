
#!/bin/bash
set -euo pipefail

: "${ADMIN_PASSWORD_HASH:?ADMIN_PASSWORD_HASH is required to initialize the admin account}"

psql \
    --username "$POSTGRES_USER" \
    --dbname "$AUTH_DB" \
    --set ON_ERROR_STOP=1 \
    --set admin_password_hash="$ADMIN_PASSWORD_HASH" <<'SQL'

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_users (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_username_lower
ON public.admin_users (LOWER(username));

INSERT INTO public.admin_users (
    username,
    password_hash,
    display_name,
    is_active
)
SELECT
    'admin',
    :'admin_password_hash',
    'Quản trị viên',
    TRUE
WHERE NOT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE LOWER(username) = LOWER('admin')
);

SQL
