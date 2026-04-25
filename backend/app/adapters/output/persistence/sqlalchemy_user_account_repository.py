"""SQLAlchemy user account repository adapter."""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.output.persistence.models import UserAccount
from app.ports.output.user_account_repository_port import UserAccountRepositoryPort


class SQLAlchemyUserAccountRepository(UserAccountRepositoryPort):
    """Persists user accounts through the configured SQLAlchemy session."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def exists_by_username(self, username: str) -> bool:
        statement = select(UserAccount.id).where(UserAccount.username == username)
        return self._db.execute(statement).scalar_one_or_none() is not None

    def create(self, username: str, password_hash: str) -> int:
        user = UserAccount(username=username, password_hash=password_hash)
        self._db.add(user)
        self._db.flush()
        self._db.commit()
        self._db.refresh(user)
        return user.id

    def get_password_hash(self, username: str) -> str | None:
        statement = select(UserAccount.password_hash).where(UserAccount.username == username)
        return self._db.execute(statement).scalar_one_or_none()

    def update_last_login(self, user_id: int, when: datetime) -> None:
        user = self._db.get(UserAccount, user_id)
        if user is None:
            return

        user.last_login = when
        self._db.commit()

    def get_user_id_by_username(self, username: str) -> int | None:
        statement = select(UserAccount.id).where(UserAccount.username == username)
        return self._db.execute(statement).scalar_one_or_none()