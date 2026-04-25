from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class SmallGroupTagMap:
    small_group_id: int
    tag_id: int
    created_at: datetime
    updated_at: Optional[datetime]
