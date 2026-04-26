import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app


pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION_DB") != "1",
    reason="Set RUN_INTEGRATION_DB=1 to run DB integration checks.",
)


def test_health_register_login_and_catalogs_against_real_db() -> None:
    client = TestClient(app)

    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}

    username = f"itest_{uuid.uuid4().hex[:8]}"
    password = "integration-secret"

    register = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": password},
    )
    assert register.status_code == 201
    token = register.json()["access_token"]
    assert token

    login = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    member_status = client.get("/api/v1/member-status", headers=headers)
    assert member_status.status_code == 200
    status_names = {item["name"] for item in member_status.json()}
    assert "active" in status_names

    families = client.get("/api/v1/families", headers=headers)
    assert families.status_code == 200
    assert any(item["name"] == "Sample Family" for item in families.json())
