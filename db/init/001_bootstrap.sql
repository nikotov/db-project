-- Runs only when the PostgreSQL data directory is first initialized.
-- Keep this minimal. Put evolving schema changes in db/migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
