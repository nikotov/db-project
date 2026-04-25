from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class EventInstance:
    id: int
    location: Optional[str]
    start_datetime: datetime
    end_datetime: datetime
    attendee_count: int
    event_series_id: int