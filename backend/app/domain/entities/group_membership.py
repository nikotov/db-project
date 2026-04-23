from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from app.domain.enums import GroupMembershipStatus


@dataclass
class GroupMembership:
    id: int
    member_id: int
    small_group_id: int
    role: GroupMembershipStatus
    joined_at: datetime
    left_at: Optional[datetime]
