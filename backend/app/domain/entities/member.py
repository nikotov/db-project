from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

from app.domain.enums import Gender, MaritalStatus


@dataclass
class Member:
    id: int
    name: str
    middle_name: Optional[str]
    last_name_parental: str
    last_name_maternal: Optional[str]
    address: Optional[str]
    birth_date: Optional[date]
    gender: Gender
    phone: Optional[str]
    email: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    marital_status: Optional[MaritalStatus]
    family_role: Optional[str]
    is_baptized: Optional[bool]
    baptized_location: Optional[str]
    member_status_id: int
    family_id: int