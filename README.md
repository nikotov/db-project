# Database Final Project (PostgreSQL)

Starter structure for a class final project using PostgreSQL.

## Project structure

- `db/init/`: SQL scripts automatically executed on first PostgreSQL container start.
- `db/migrations/`: Versioned schema changes (`0001_...sql`, `0002_...sql`, etc.).
- `db/seeds/`: Development/test seed data.
- `db/scripts/`: Helper scripts for local DB workflows.
- `schema_final.sql`: Original DER export file (MySQL Workbench format).
- `docs/`: Requirement notes and architecture decisions.
- `src/`: Application code (to be decided later).
- `tests/db/`: DB-focused test notes and future integration tests.

## DER to PostgreSQL note

The file `schema_final.sql` uses MySQL syntax from Workbench.
The PostgreSQL-ready baseline is in `db/migrations/0001_initial_schema.sql`.

## Quick start

1. Copy environment variables:
   - `cp .env.example .env`
2. Start PostgreSQL:
   - `docker compose up -d`
3. Check logs:
   - `docker compose logs -f postgres`

Note:
- On first startup (empty volume), Docker will automatically run:
   - `db/init/001_bootstrap.sql`
   - `db/migrations/0001_initial_schema.sql`
   - `db/seeds/001_seed_dev.sql`
- If you need to re-run init scripts, reset the volume:
   - `docker compose down -v && docker compose up -d`

## Suggested first milestones

1. Write initial schema in `db/migrations/0001_initial_schema.sql`.
2. Add seed data in `db/seeds/001_seed_dev.sql`.
3. Decide application stack in `src/` and connect to PostgreSQL.
