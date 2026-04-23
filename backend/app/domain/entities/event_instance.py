from dataclasses import dataclass
from datetime import datetime

@dataclass
class EventInstance:
    """Represents an instance of an event in the system."""

    id: int
    event_series_id: int
    start_datetime: datetime
    end_datetime: datetime 
    attendees_count: int | None