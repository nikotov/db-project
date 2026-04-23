from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class EventSeriesTagMap:
    event_series_id: int
    event_tag_id: int
    created_at: datetime
    updated_at: Optional[datetime]
