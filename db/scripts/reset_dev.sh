#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/../.." && pwd)"

cd "$project_root"

# Resets local PostgreSQL state, reapplies schema, and loads dev seed data.
docker compose down -v
docker compose up -d

until docker compose exec -T postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; do
	sleep 1
done

cd backend
alembic upgrade head

cd "$project_root"
cat db/seeds/001_seed_dev.sql | docker compose exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

echo "PostgreSQL reset, migration, and seed completed."
