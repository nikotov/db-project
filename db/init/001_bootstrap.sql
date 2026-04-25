-- Runs only when the PostgreSQL data directory is first initialized.
-- Keep this minimal. Put evolving schema changes in backend/alembic/versions.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
