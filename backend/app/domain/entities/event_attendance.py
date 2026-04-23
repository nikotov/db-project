from dataclasses import dataclass

from app.domain.enums.attendance_status import AttendanceStatus

@dataclass
class EventAttendance:
    """Represents an attendance record for an event."""

    event_instance_id: int
    member_id: int
    status: AttendanceStatus