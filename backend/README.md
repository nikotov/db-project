# Backend

FastAPI + SQLAlchemy backend for the database project.

## Tech Stack

- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Database**: PostgreSQL
- **Server**: Uvicorn

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                         # FastAPI app entry point (composition root)
│   ├── config.py                       # Configuration & settings
│   ├── database.py                     # SQLAlchemy engine/session setup
│   ├── domain/                         # Core business logic (framework-agnostic)
│   │   ├── entities/                   # Domain entities
│   │   └── services/                   # Use-case implementations
│   ├── ports/                          # Interface contracts
│   │   ├── input/                      # Use-case interfaces
│   │   └── output/                     # Persistence/external service interfaces
│   └── adapters/                       # Framework/infrastructure implementations
│       ├── input/http/                 # FastAPI routes/controllers
│       └── output/persistence/         # SQLAlchemy repositories/models
├── alembic/                            # Alembic migration scripts
│   ├── env.py
│   └── versions/
├── alembic.ini                         # Alembic configuration
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variables template
└── README.md
```

## Architecture

This backend follows a hexagonal architecture (ports and adapters):

- Domain: pure business rules and entities.
- Ports: contracts the domain exposes/depends on.
- Adapters: concrete FastAPI and database implementations.

Dependency direction points inward: adapters -> ports -> domain.

## Database Migrations (Alembic)

Run commands from the `backend/` folder:

```bash
alembic revision --autogenerate -m "describe_change"
alembic upgrade head
alembic downgrade -1
```

Notes:

- `alembic/env.py` uses `DATABASE_URL` from your `.env` through app settings.
- Keep SQLAlchemy models under `app/adapters/output/persistence/` and import them in `alembic/env.py` so autogenerate can detect changes.
- Alembic is the single schema migration path for this project.
- The baseline schema is tracked by revision `0001_initial_schema` in `alembic/versions/0001_initial_schema.py`.
- Baseline seed data is applied through migration `0002_user_role_and_baseline_seed`.

### Local DB Bootstrap Flow

From project root:

```bash
docker compose up -d
```

Then from `backend/`:

```bash
alembic upgrade head
```

Optional additional seed load (from project root):

```bash
cat db/seeds/001_seed_dev.sql | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

## Security Settings

Configure these variables in `.env` / deployment environment:

- `APP_ENV`: `development`, `test`, or `production`.
- `JWT_SECRET_KEY`: required in production (do not use defaults).
- `CORS_ALLOW_ORIGINS`: comma-separated origins, e.g. `http://localhost:3000,https://your-domain`.

## Integration Checks

Run API + DB integration checks (requires migrated PostgreSQL):

```bash
RUN_INTEGRATION_DB=1 pytest backend/tests/integration -q
```

## Getting Started

### 1. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run the development server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

- **API docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/api/v1/health

## Development

### Adding a New Use Case

1. Define/extend an input port in `app/ports/input/`.
2. Implement it in `app/domain/services/`.
3. Expose it via HTTP in `app/adapters/input/http/routes/`.

### Adding Persistence for a Use Case

1. Define an output port in `app/ports/output/`.
2. Implement it in `app/adapters/output/persistence/`.
3. Inject adapter implementation into the domain service.
