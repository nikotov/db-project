from enum import Enum

class MemberStatus(str, Enum):

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BANNED = "BANNED"

    def __str__(self) -> str:
        return self.value