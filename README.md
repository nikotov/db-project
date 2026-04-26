# Database Final Project (PostgreSQL)

Starter structure for a class final project using PostgreSQL.

## Project structure

- `backend/`: Backend application code.
- `frontend/`: Frontend application code.
- `db/init/`: Minimal SQL bootstrap scripts (extensions only) executed on first PostgreSQL container start.
- `db/migrations/`: Legacy SQL migration snapshots (reference-only; not executed by Docker).
- `db/seeds/`: Development/test seed data.
- `db/scripts/`: Helper scripts for local DB workflows.
- `schema_final.sql`: Original DER export file (MySQL Workbench format).
- `docs/`: Requirement notes and architecture decisions.
- `tests/db/`: DB-focused test notes and future integration tests.

Backend note:
- `backend/` follows hexagonal architecture (`domain/`, `ports/`, `adapters/`) and uses Alembic for migrations.

## DER to PostgreSQL note

The file `schema_final.sql` uses MySQL syntax from Workbench.
The active PostgreSQL schema migration path is Alembic in `backend/alembic/versions/`.

## Quick start

1. Copy environment variables:
   - Create `.env` with at least:
     - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
     - `JWT_SECRET_KEY`
     - `CORS_ALLOW_ORIGINS`
2. Start PostgreSQL:
   - `docker compose up -d`
3. Apply DB schema migrations:
   - `cd backend && alembic upgrade head`
4. Check logs:
   - `docker compose logs -f postgres`

Note:
- On first startup (empty volume), Docker will only run minimal bootstrap scripts in `db/init/`.
- Schema changes are applied through Alembic only.
- If you need to reinitialize local DB state:
   - `docker compose down -v && docker compose up -d`
   - `cd backend && alembic upgrade head`

## Suggested first milestones

1. Create schema revisions in `backend/alembic/versions/`.
2. Add seed data in `db/seeds/001_seed_dev.sql`.
3. Implement backend use cases in `backend/app/domain/` and adapters in `backend/app/adapters/`.
4. Apply DB migrations with Alembic.
