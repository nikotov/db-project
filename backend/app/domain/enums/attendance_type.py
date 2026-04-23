from enum import Enum

class AttendanceType(str, Enum):

    GENERAL = "GENERAL"
    INDIVIDUAL = "INDIVIDUAL"


    def __str__(self) -> str:
        return self.value