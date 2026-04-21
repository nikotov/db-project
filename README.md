# Database Final Project (PostgreSQL)

Starter structure for a class final project using PostgreSQL.

## Project structure

- `db/init/`: SQL scripts automatically executed on first PostgreSQL container start.
- `db/migrations/`: Versioned schema changes (`0001_...sql`, `0002_...sql`, etc.).
- `db/seeds/`: Development/test seed data.
- `db/scripts/`: Helper scripts for local DB workflows.
- `docs/`: Requirement notes and architecture decisions.
- `src/`: Application code (to be decided later).
- `tests/db/`: DB-focused test notes and future integration tests.

## Quick start

1. Copy environment variables:
   - `cp .env.example .env`
2. Start PostgreSQL:
   - `docker compose up -d`
3. Check logs:
   - `docker compose logs -f postgres`

## Suggested first milestones

1. Write initial schema in `db/migrations/0001_initial_schema.sql`.
2. Add seed data in `db/seeds/001_seed_dev.sql`.
3. Decide application stack in `src/` and connect to PostgreSQL.
