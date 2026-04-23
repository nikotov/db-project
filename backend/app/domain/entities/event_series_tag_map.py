from dataclasses import dataclass
from datetime import datetime

@dataclass
class EventSeriesTagMap:
    """Represents a mapping between an event series and a tag."""

    event_series_id: int
    event_tag_id: int
    created_at: datetime
    updated_at: datetime