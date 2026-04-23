from enum import Enum


class Gender(str, Enum):
    MALE = "M"
    FEMALE = "F"
    OTHER = "Other"

    def __str__(self) -> str:
        return self.value