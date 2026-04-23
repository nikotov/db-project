from dataclasses import dataclass

from app.domain.enums import MemberAttendanceStatus


@dataclass
class EventMemberAttendance:
    event_instance_id: int
    member_id: int
    status: MemberAttendanceStatus
