from enum import Enum

class AttendanceStatus(str, Enum):
    ATTENDED = "attended"
    ABSENT = "absent"

    def __str__(self) -> str:
        return self.value