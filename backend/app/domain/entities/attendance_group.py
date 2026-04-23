from dataclasses import dataclass
from typing import Optional


@dataclass
class AttendanceGroup:
    id: int
    name: str
    description: Optional[str]
