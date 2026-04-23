from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class UserLogs:
    id: int
    user_id: int
    action_type: str
    description: Optional[str]
    created_at: datetime
