from dataclasses import dataclass
from datetime import date
from app.domain.enums import Gender, MemberStatus

@dataclass
class Member:
    """Represents a member in the system."""

    id: int
    name: str
    middle_name: str | None
    last_name_paternal: str
    last_name_maternal: str | None
    address: str | None
    birth_date: date | None
    gender: Gender
    phone: str | None
    email: str | None
    created_at: date
    updated_at: date
    marital_status: str | None
    family_role: str | None
    is_baptized: bool | None
    baptized_location: str | None
    member_status: MemberStatus
    family_id: int