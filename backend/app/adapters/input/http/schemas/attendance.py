"""HTTP schemas for attendance routes."""
from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.member_attendance_status import MemberAttendanceStatus
from app.domain.enums.registration_status import RegistrationStatus


class GroupCountUpsert(BaseModel):
    attendance_group_id: int = Field(ge=1)
    count: int = Field(ge=0)


class GeneralAttendanceUpsert(BaseModel):
    event_instance_id: int = Field(ge=1)
    attendee_count: int = Field(ge=0)
    group_counts: list[GroupCountUpsert] = Field(default_factory=list)


class MemberAttendanceUpsert(BaseModel):
    event_instance_id: int = Field(ge=1)
    member_id: int = Field(ge=1)
    attendance_status: MemberAttendanceStatus = MemberAttendanceStatus.PENDING
    registration_status: RegistrationStatus = RegistrationStatus.REGISTERED


class MemberAttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_instance_id: int
    member_id: int
    attendance_status: MemberAttendanceStatus
    registration_status: RegistrationStatus


class AttendanceGroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=45)
    description: str | None = Field(default=None, max_length=255)


class AttendanceGroupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str | None
