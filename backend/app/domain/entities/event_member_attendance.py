from dataclasses import dataclass

from app.domain.enums import MemberAttendanceStatus
from app.domain.enums.registration_status import RegistrationStatus


@dataclass
class EventMemberAttendance:
    event_instance_id: int
    member_id: int
    registered_status: RegistrationStatus
    attendance_status: MemberAttendanceStatus
