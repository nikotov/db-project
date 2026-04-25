"""SQLAlchemy user log writer adapter."""
import json

from sqlalchemy.orm import Session

from app.adapters.output.persistence.models import UserLogs
from app.ports.output.user_log_writer_port import UserLogWriterPort


class SQLAlchemyUserLogWriter(UserLogWriterPort):
    """Writes user activity logs to the database."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def log(self, user_id: int | None, action: str, metadata: dict | None = None) -> None:
        if user_id is None:
            return

        description = json.dumps(metadata or {}, separators=(",", ":"))
        if len(description) > 255:
            description = f"{description[:252]}..."

        self._db.add(
            UserLogs(
                user_id=user_id,
                action_type=action,
                description=description,
            )
        )
        self._db.commit()