from dataclasses import dataclass
from datetime import date, datetime, timezone

from fastapi.testclient import TestClient

from app.adapters.input.http.routes.auth import get_auth_service
from app.adapters.input.http.routes.members import get_member_service
from app.domain.entities.member import Member
from app.domain.enums import Gender, MaritalStatus
from app.domain.services.auth_service import InvalidCredentialsException, UsernameAlreadyExistsException
from app.domain.services.member_service import MemberNotFoundException
from app.main import app


@dataclass
class _AuthResult:
    access_token: str
    token_type: str = "bearer"


class FakeAuthService:
    def __init__(self) -> None:
        self.users = {"admin": "admin"}

    def register(self, command):
        if command.username in self.users:
            raise UsernameAlreadyExistsException(f"Username '{command.username}' is already taken.")
        self.users[command.username] = command.password
        return _AuthResult(access_token=f"token-{command.username}")

    def authenticate(self, command):
        password = self.users.get(command.username)
        if password is None or password != command.password:
            raise InvalidCredentialsException("Invalid username or password.")
        return _AuthResult(access_token=f"token-{command.username}")


class FakeMemberService:
    def __init__(self) -> None:
        self._members: dict[int, Member] = {}
        self._next_id = 1

    def count_members(self) -> int:
        return len(self._members)

    def list_members(self, limit: int = 100, offset: int = 0) -> list[Member]:
        members = [self._members[idx] for idx in sorted(self._members)]
        return members[offset : offset + limit]

    def get_member(self, member_id: int) -> Member:
        member = self._members.get(member_id)
        if member is None:
            raise MemberNotFoundException(f"Member with id {member_id} was not found.")
        return member

    def create_member(self, member: Member) -> int:
        member_id = self._next_id
        self._next_id += 1
        self._members[member_id] = Member(
            id=member_id,
            name=member.name,
            middle_name=member.middle_name,
            last_name_parental=member.last_name_parental,
            last_name_maternal=member.last_name_maternal,
            address=member.address,
            birth_date=member.birth_date,
            gender=member.gender,
            phone=member.phone,
            email=member.email,
            created_at=member.created_at,
            updated_at=member.updated_at,
            marital_status=member.marital_status,
            family_role=member.family_role,
            is_baptized=member.is_baptized,
            baptized_location=member.baptized_location,
            member_status_id=member.member_status_id,
            family_id=member.family_id,
        )
        return member_id

    def update_member(self, member: Member) -> None:
        if member.id not in self._members:
            raise MemberNotFoundException(f"Member with id {member.id} was not found.")
        self._members[member.id] = member

    def delete_member(self, member_id: int) -> None:
        if member_id not in self._members:
            raise MemberNotFoundException(f"Member with id {member_id} was not found.")
        del self._members[member_id]


def _sample_member_payload() -> dict:
    return {
        "name": "John",
        "middle_name": None,
        "last_name_parental": "Doe",
        "last_name_maternal": None,
        "address": "Main St 123",
        "birth_date": "1990-01-01",
        "gender": "M",
        "phone": "555-0101",
        "email": "john.doe@example.com",
        "marital_status": "Single",
        "family_role": "father",
        "is_baptized": True,
        "baptized_location": "Local Church",
        "member_status_id": 1,
        "family_id": 1,
    }


def _build_client() -> tuple[TestClient, FakeAuthService, FakeMemberService]:
    fake_auth = FakeAuthService()
    fake_members = FakeMemberService()

    app.dependency_overrides[get_auth_service] = lambda: fake_auth
    app.dependency_overrides[get_member_service] = lambda: fake_members

    client = TestClient(app)
    return client, fake_auth, fake_members


def _cleanup_overrides() -> None:
    app.dependency_overrides.clear()


def test_health_route_returns_ok() -> None:
    client, _, _ = _build_client()
    try:
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    finally:
        _cleanup_overrides()


def test_auth_register_and_login_routes() -> None:
    client, _, _ = _build_client()
    try:
        register = client.post(
            "/api/v1/auth/register",
            json={"username": "newuser", "password": "supersecret"},
        )
        assert register.status_code == 201
        assert register.json()["access_token"] == "token-newuser"

        login = client.post(
            "/api/v1/auth/login",
            json={"username": "newuser", "password": "supersecret"},
        )
        assert login.status_code == 200
        assert login.json()["access_token"] == "token-newuser"
    finally:
        _cleanup_overrides()


def test_auth_register_conflict_and_invalid_login() -> None:
    client, _, _ = _build_client()
    try:
        conflict = client.post(
            "/api/v1/auth/register",
            json={"username": "admin", "password": "supersecret"},
        )
        assert conflict.status_code == 409

        invalid = client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "wrong"},
        )
        assert invalid.status_code == 401
        assert invalid.json()["detail"] == "Invalid username or password."
    finally:
        _cleanup_overrides()


def test_member_create_get_list_and_count_routes() -> None:
    client, _, _ = _build_client()
    try:
        create = client.post("/api/v1/members", json=_sample_member_payload())
        assert create.status_code == 201
        created = create.json()
        assert created["id"] == 1
        assert created["name"] == "John"

        get_one = client.get("/api/v1/members/1")
        assert get_one.status_code == 200
        assert get_one.json()["email"] == "john.doe@example.com"

        list_members = client.get("/api/v1/members", params={"limit": 10, "offset": 0})
        assert list_members.status_code == 200
        assert len(list_members.json()) == 1

        count = client.get("/api/v1/members/count")
        assert count.status_code == 200
        assert count.json() == {"total": 1}
    finally:
        _cleanup_overrides()


def test_member_update_preserves_created_at() -> None:
    client, _, _ = _build_client()
    try:
        created = client.post("/api/v1/members", json=_sample_member_payload())
        assert created.status_code == 201
        created_payload = created.json()
        created_at = created_payload["created_at"]

        update_payload = _sample_member_payload()
        update_payload["name"] = "John Updated"
        update = client.put("/api/v1/members/1", json=update_payload)
        assert update.status_code == 200

        updated_payload = update.json()
        assert updated_payload["name"] == "John Updated"
        assert updated_payload["created_at"] == created_at
        assert updated_payload["updated_at"] is not None
    finally:
        _cleanup_overrides()


def test_member_not_found_route() -> None:
    client, _, _ = _build_client()
    try:
        not_found = client.get("/api/v1/members/999")
        assert not_found.status_code == 404
    finally:
        _cleanup_overrides()

def test_member_delete_route() -> None:
    client, _, _ = _build_client()
    try:
        created = client.post("/api/v1/members", json=_sample_member_payload())
        assert created.status_code == 201

        delete = client.delete("/api/v1/members/1")
        assert delete.status_code == 204

        get_deleted = client.get("/api/v1/members/1")
        assert get_deleted.status_code == 404
    finally:
        _cleanup_overrides()