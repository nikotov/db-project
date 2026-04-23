from enum import Enum


class AttendanceType(str, Enum):
    GENERAL = "general"
    INDIVIDUAL = "individual"

    def __str__(self) -> str:
        return self.value