from dataclasses import dataclass
from datetime import datetime, time
from typing import Optional

from app.domain.enums.attendance_type import AttendanceType
from app.domain.enums.event_series_status import EventSeriesStatus
from app.domain.enums.recurrence_type import RecurrenceType


@dataclass
class EventSeries:
    id: int
    name: str
    description: Optional[str]
    attendance_type: AttendanceType
    recurrence_type: RecurrenceType
    recurrence_rule: Optional[str]
    status: EventSeriesStatus
    location: Optional[str]
    start_time: Optional[time]
    end_time: Optional[time]
    created_at: datetime
    updated_at: Optional[datetime]