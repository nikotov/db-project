from dataclasses import dataclass

@dataclass
class SmallGroupTag:
    """Represents a tag associated with a small group."""

    id: int
    name: str
    color: str