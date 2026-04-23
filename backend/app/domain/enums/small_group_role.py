from enum import Enum

class SmallGroupRole(str, Enum):
    LEADER = "LEADER"
    MEMBER = "MEMBER"
    ASSISTANT = "ASSISTANT"

    def __str__(self) -> str:
        return self.value