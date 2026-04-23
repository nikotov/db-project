from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class UserAccount:
    id: int
    username: str
    password_hash: str
    created_at: datetime
    last_login: Optional[datetime]
