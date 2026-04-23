from dataclasses import dataclass
from datetime import datetime

@dataclass
class EventInstance:
    id: int
    start_datetime: datetime
    end_datetime: datetime
    attendee_count: int
    event_series_id: int