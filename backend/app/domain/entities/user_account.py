from dataclasses import dataclass
from datetime import datetime

@dataclass
class UserAccount:
    """Represents a user account in the system."""

    id: int
    username: str
    password_hash: str
    created_at: datetime
    last_login: datetime | None