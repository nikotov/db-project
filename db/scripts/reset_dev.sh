#!/usr/bin/env bash
set -euo pipefail

# Resets the local PostgreSQL container and volume for a clean state.
docker compose down -v
docker compose up -d

echo "Local PostgreSQL reset completed."
