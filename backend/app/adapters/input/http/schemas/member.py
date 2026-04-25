"""HTTP schemas for member routes."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import Gender, MaritalStatus


class MemberResponse(BaseModel):
    """HTTP response model for a member record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    middle_name: str | None
    last_name_parental: str
    last_name_maternal: str | None
    address: str | None
    birth_date: date | None
    gender: Gender
    phone: str | None
    email: str | None
    created_at: datetime
    updated_at: datetime | None
    marital_status: MaritalStatus | None
    family_role: str | None
    is_baptized: bool | None
    baptized_location: str | None
    member_status_id: int
    family_id: int


class MemberCountResponse(BaseModel):
    """Simple count payload for dashboard and summaries."""

    total: int = Field(ge=0)


class MemberCreateRequest(BaseModel):
    """Payload for creating a new member."""

    name: str = Field(min_length=1, max_length=45)
    middle_name: str | None = Field(default=None, max_length=45)
    last_name_parental: str = Field(min_length=1, max_length=45)
    last_name_maternal: str | None = Field(default=None, max_length=45)
    address: str | None = Field(default=None, max_length=45)
    birth_date: date | None = None
    gender: Gender
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=100)
    marital_status: MaritalStatus | None = None
    family_role: str | None = Field(default=None, max_length=45)
    is_baptized: bool | None = None
    baptized_location: str | None = Field(default=None, max_length=45)
    member_status_id: int = Field(ge=1)
    family_id: int = Field(ge=1)