from dataclasses import dataclass
from typing import Optional


@dataclass
class EventTag:
    id: int
    name: str
    color: Optional[str]
