from dataclasses import dataclass

@dataclass
class EventTag:
    """Represents a tag associated with an event."""

    id: int
    name: str
    color: str