"""HTTP schemas for user log routes."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    action_type: str
    description: Optional[str]
    created_at: datetime
