from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from app.domain.enums.attendance_type import AttendanceType


@dataclass
class EventSeries:
    id: int
    name: str
    description: Optional[str]
    attendance_type: AttendanceType
    is_recurring: bool
    recurrence_rule: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]