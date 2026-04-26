#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/../.." && pwd)"

cd "$project_root"

echo "[verify] Starting containers and rebuilding images..."
docker compose up --build -d

echo "[verify] Waiting for PostgreSQL to become healthy..."
until docker compose exec -T postgres sh -lc 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; do
  sleep 1
done

echo "[verify] Checking backend migration and process logs..."
backend_started=0
for _ in {1..20}; do
  backend_logs="$(docker compose logs --tail=120 backend)"
  if [[ "$backend_logs" == *"Uvicorn running"* ]]; then
    backend_started=1
    break
  fi
  sleep 1
done

if [[ "$backend_started" -ne 1 ]]; then
  echo "[verify] ERROR: backend did not finish startup."
  exit 1
fi

echo "[verify] Running API role smoke test..."
python3 - <<'PY'
import uuid
import requests

base = "http://localhost:8000/api/v1"
username = f"verify_{uuid.uuid4().hex[:8]}"
password = "VerifyPass123"

register = requests.post(f"{base}/auth/register", json={"username": username, "password": password}, timeout=15)
register.raise_for_status()
user_token = register.json()["access_token"]

member_status = requests.get(
    f"{base}/member-status",
    headers={"Authorization": f"Bearer {user_token}"},
    timeout=15,
)
member_status.raise_for_status()

logs_as_member = requests.get(
    f"{base}/user-logs",
    headers={"Authorization": f"Bearer {user_token}"},
    timeout=15,
)
if logs_as_member.status_code != 403:
    raise RuntimeError(f"Expected 403 for member in /user-logs, got {logs_as_member.status_code}")

admin_login = requests.post(
    f"{base}/auth/login",
    json={"username": "admin", "password": "admin"},
    timeout=15,
)
admin_login.raise_for_status()
admin_token = admin_login.json()["access_token"]

logs_as_admin = requests.get(
    f"{base}/user-logs",
    headers={"Authorization": f"Bearer {admin_token}"},
    timeout=15,
)
logs_as_admin.raise_for_status()
PY

echo "[verify] OK: migrations, auth, and RBAC checks passed."
