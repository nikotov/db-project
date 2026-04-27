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

Follow these steps to set up and run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/nikotov/db-project.git
cd db-project
```

### 2. Start containers

```bash
docker compose up --build
```

### 3. Add seeded dev data

```bash
./db/scripts/reset_dev.sh
```


## One-command verification

Run an end-to-end local verification (build, DB health, migration log check, auth/RBAC smoke):

- `./db/scripts/verify.sh`

Note:
- On first startup (empty volume), Docker will only run minimal bootstrap scripts in `db/init/`.
- Schema changes are applied through Alembic only.
- If you need to reinitialize local DB state, run reset_dev.sh script