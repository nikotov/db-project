from dataclasses import dataclass
from datetime import date
from app.domain.enums import Gender, MemberStatus

@dataclass
class Member:
    """Represents a member in the system."""

    id: int
    name: str
    middle_name: str
    last_name_paternal: str
    last_name_maternal: str
    address: str
    birth_date: date
    gender: Gender
    phone: str
    email: str
    created_at: date
    updated_at: date
    marital_status: str
    family_role: str
    is_baptized: bool
    baptized_location: str
    member_status: MemberStatus
    family_id: int