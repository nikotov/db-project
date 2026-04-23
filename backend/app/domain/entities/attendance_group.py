from dataclasses import dataclass

@dataclass

class AttendanceGroup:
    """Represents an attendance group in the system."""

    id: int
    name: str
    description: str | None