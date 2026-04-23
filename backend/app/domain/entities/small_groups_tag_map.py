from dataclasses import dataclass
from datetime import datetime

@dataclass
class SmallGroupsTagMap:
    """Represents a mapping between a small group and a tag."""

    small_group_id: int
    group_tag_id: int
    created_at: datetime
    updated_at: datetime