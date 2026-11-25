# CNPM2 database schema (authoritative draft)

These three SQL files implement the database design supplied for CNPM2:

- `auth_db.sql`: exactly 1 table (`admin_users`)
- `poi_db.sql`: exactly 4 tables (`pois`, `tours`, `tour_pois`, `visitor_sessions`)
- `ai_db.sql`: exactly 4 tables (`languages`, `narration_requests`, `narration_contents`, `audio_files`)

Total: **9 application tables across 3 service-owned databases**. PostgreSQL's internal/system tables are not included in this count.

## Important

This is the schema baseline for the source-code refactor. The current EF Core entities and migrations in this repository are still from the previous design and must be updated before these scripts are applied to the running application. Do not run these scripts against the current databases yet. Keep the existing `backup-*.sql` files.

Once the service models and migrations are aligned, create the databases and apply each file to its matching database:

```bash
createdb auth_db
createdb poi_db
createdb ai_db
psql -d auth_db -f auth_db.sql
psql -d poi_db -f poi_db.sql
psql -d ai_db -f ai_db.sql
```

The `created_by_admin_id`, `updated_by_admin_id`, `poi_id` and `session_id` fields are logical cross-database references; there are intentionally no foreign keys across databases.
