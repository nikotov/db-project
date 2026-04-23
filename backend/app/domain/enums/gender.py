from enum import Enum

class Gender(str, Enum):

    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

    def __str__(self) -> str:
        return self.value