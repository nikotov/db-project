"""In-memory user log writer adapter for backend-only development."""
from datetime import datetime, timezone

from app.ports.output.user_log_writer_port import UserLogWriterPort


class InMemoryUserLogWriter(UserLogWriterPort):
    """Collects auth/user events in process memory."""

    def __init__(self) -> None:
        self.logs: list[dict[str, object]] = []

    def log(self, user_id: int | None, action: str, metadata: dict | None = None) -> None:
        self.logs.append(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_id": user_id,
                "action": action,
                "metadata": metadata or {},
            }
        )
