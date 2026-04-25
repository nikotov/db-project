from enum import Enum


class EventSeriesStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

    def __str__(self) -> str:
        return self.value