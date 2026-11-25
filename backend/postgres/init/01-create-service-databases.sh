
#!/bin/bash
set -euo pipefail

# PostgreSQL tự tạo database trong POSTGRES_DB.
# Script này tạo thêm database cho các service còn lại.
for database in "${AUTH_DB:-auth_db}" "${POI_DB:-poi_db}" "${AI_DB:-ai_db}"; do
  if ! psql \
      --username "$POSTGRES_USER" \
      --dbname postgres \
      --tuples-only \
      --no-align \
      --set=database="$database" \
      --command="SELECT 1 FROM pg_database WHERE datname = :'database'" | grep -q 1; then

    psql \
      --username "$POSTGRES_USER" \
      --dbname postgres \
      --set=database="$database" \
      --command="CREATE DATABASE \"$database\""
  fi
done
