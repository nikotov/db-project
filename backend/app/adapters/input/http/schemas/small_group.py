"""HTTP schemas for small-group routes."""
from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.day_of_week import DayOfWeek
from app.domain.enums.small_group_status import SmallGroupStatus
from app.domain.enums.group_membership_status import GroupMembershipStatus


# Small Group Tag

class SmallGroupTagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=45)
    color: Optional[str] = Field(default=None, max_length=7)


class SmallGroupTagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    color: Optional[str]


# Small Group 

class SmallGroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=45)
    description: Optional[str] = Field(default=None, max_length=255)
    meeting_day: DayOfWeek
    meeting_time: time
    location: Optional[str] = Field(default=None, max_length=255)
    status: SmallGroupStatus = SmallGroupStatus.ACTIVE
    tag_ids: list[int] = Field(default_factory=list)


class SmallGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str]
    meeting_day: DayOfWeek
    meeting_time: time
    location: Optional[str]
    status: SmallGroupStatus
    created_at: datetime
    updated_at: Optional[datetime]
    tags: list[SmallGroupTagResponse] = Field(default_factory=list)


# Group Membership 

class GroupMembershipCreate(BaseModel):
    member_id: int = Field(ge=1)
    small_group_id: int = Field(ge=1)
    role: GroupMembershipStatus = GroupMembershipStatus.MEMBER


class GroupMembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    member_id: int
    small_group_id: int
    role: GroupMembershipStatus
    joined_at: datetime
    left_at: Optional[datetime]
