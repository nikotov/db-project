-- Initial schema migration.
-- Replace with your actual domain tables.

BEGIN;

CREATE TABLE IF NOT EXISTS healthcheck (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
