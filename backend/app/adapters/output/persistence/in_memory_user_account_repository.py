"""In-memory user account repository adapter for backend-only development."""
from dataclasses import dataclass
from datetime import datetime

from app.ports.output.user_account_repository_port import UserAccountRepositoryPort


@dataclass
class _InMemoryUser:
    id: int
    username: str
    password_hash: str
    created_at: datetime
    last_login: datetime | None = None


class InMemoryUserAccountRepository(UserAccountRepositoryPort):
    """Simple in-memory repository for auth flows without DB integration."""

    def __init__(self) -> None:
        self._users_by_username: dict[str, _InMemoryUser] = {
            "admin": _InMemoryUser(
                id=1,
                username="admin",
                password_hash=(
                    "pbkdf2_sha256$200000$"
                    "2HjThhFU6syzmHvintRxn4Vlm55zEOBtLhGjHb+8u9c8cBVoDpGUGoy14qa90+Pb"
                ),
                created_at=datetime.utcnow(),
            )
        }
        self._next_id = 2

    def exists_by_username(self, username: str) -> bool:
        return username in self._users_by_username

    def create(self, username: str, password_hash: str) -> int:
        user_id = self._next_id
        self._next_id += 1
        self._users_by_username[username] = _InMemoryUser(
            id=user_id,
            username=username,
            password_hash=password_hash,
            created_at=datetime.utcnow(),
        )
        return user_id

    def get_password_hash(self, username: str) -> str | None:
        user = self._users_by_username.get(username)
        return None if user is None else user.password_hash

    def update_last_login(self, user_id: int, when: datetime) -> None:
        for user in self._users_by_username.values():
            if user.id == user_id:
                user.last_login = when
                return

    def get_user_id_by_username(self, username: str) -> int | None:
        user = self._users_by_username.get(username)
        return None if user is None else user.id
