from dataclasses import dataclass
from datetime import date

from app.domain.enums.small_group_role import SmallGroupRole

@dataclass
class GroupMembership:
    """Represents a membership of a member in a group."""

    small_group_id: int
    member_id: int
    joined_at: date
    left_at: date | None
    role: SmallGroupRole