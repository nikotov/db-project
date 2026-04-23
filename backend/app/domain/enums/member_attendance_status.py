from enum import Enum


class MemberAttendanceStatus(str, Enum):
    ATTENDED = "attended"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"
    UNKNOWN = "unknown"

    def __str__(self) -> str:
        return self.value
