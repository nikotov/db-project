from dataclasses import dataclass
from datetime import datetime, time
from typing import Optional

from app.domain.enums import DayOfWeek


@dataclass
class SmallGroup:
    id: int
    name: str
    description: Optional[str]
    meeting_day: DayOfWeek
    meeting_time: time
    location: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
