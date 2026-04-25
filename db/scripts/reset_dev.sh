#!/usr/bin/env bash
set -euo pipefail

# Resets local PostgreSQL state and reapplies schema through Alembic.
docker compose down -v
docker compose up -d

echo "PostgreSQL reset completed."
echo "Apply schema migrations with Alembic from backend/:"
echo "  alembic upgrade head"
