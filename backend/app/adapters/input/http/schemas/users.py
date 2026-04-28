"""HTTP schemas for user management routes."""
from pydantic import BaseModel, ConfigDict, Field

from app.adapters.input.http.schemas.base import UtcDatetime


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    created_at: UtcDatetime
    last_login: UtcDatetime | None


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=45)
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="member", min_length=3, max_length=20)


class UserUpdateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=45)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: str = Field(default="member", min_length=3, max_length=20)