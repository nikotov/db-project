from dataclasses import dataclass
from datetime import datetime
from app.domain.enums.attendance_type import AttendanceType

@dataclass
class EventSeries:
    """Represents a series of events in the system."""

    id: int
    title: str
    description: str | None
    attendance_type: AttendanceType
    is_recurring: bool
    recurrence_rule: str | None
    created_at: datetime
    updated_at: datetime