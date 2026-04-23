from enum import Enum


class GroupMembershipStatus(str, Enum):
    LEADER = "leader"
    MEMBER = "member"
    UNKNOWN = "unknown"

    def __str__(self) -> str:
        return self.value
