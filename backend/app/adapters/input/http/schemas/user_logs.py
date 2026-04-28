"""HTTP schemas for user log routes."""
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.adapters.input.http.schemas.base import UtcDatetime


class UserLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    action_type: str
    description: Optional[str]
    created_at: UtcDatetime