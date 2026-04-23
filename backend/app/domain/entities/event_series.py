from dataclasses import dataclass
from datetime import date
from app.domain.enums.attendance_type import AttendanceType

@dataclass
class EventSeries:
    """Represents a series of events in the system."""

    id: int
    title: str
    description: str
    attendance_type: AttendanceType
    is_recurring: bool
    recurrence_rule: str
    created_at: date
    updated_at: date