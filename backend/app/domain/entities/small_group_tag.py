from dataclasses import dataclass
from typing import Optional


@dataclass
class SmallGroupTag:
    id: int
    name: str
    color: Optional[str]
