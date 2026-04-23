from dataclasses import dataclass
from datetime import datetime

@dataclass
class UserLog:
    """Represents a log entry for user activities in the system."""

    id: int
    user_id: int
    action_type: str
    description: str | None
    created_at: datetime