"""HTTP schemas for event-series, event-instance and event-tag routes."""
from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.event_series_status import EventSeriesStatus
from app.domain.enums.recurrence_type import RecurrenceType
from app.domain.enums.attendance_type import AttendanceType


# Event Tag 

class EventTagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=45)
    color: Optional[str] = Field(default=None, max_length=7)


class EventTagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    color: Optional[str]


# Event Series 

class EventSeriesCreate(BaseModel):
    name: str = Field(min_length=1, max_length=45)
    description: Optional[str] = Field(default=None, max_length=255)
    attendance_type: AttendanceType
    recurrence_type: RecurrenceType = RecurrenceType.NONE
    recurrence_rule: Optional[str] = Field(default=None, max_length=255)
    status: EventSeriesStatus = EventSeriesStatus.ACTIVE
    location: Optional[str] = Field(default=None, max_length=255)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    tag_ids: list[int] = Field(default_factory=list)


class EventSeriesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str]
    attendance_type: AttendanceType
    recurrence_type: RecurrenceType
    recurrence_rule: Optional[str]
    status: EventSeriesStatus
    location: Optional[str]
    start_time: Optional[time]
    end_time: Optional[time]
    created_at: datetime
    updated_at: Optional[datetime]
    tags: list[EventTagResponse] = Field(default_factory=list)


# Event Instance 

class EventInstanceCreate(BaseModel):
    event_series_id: int = Field(ge=1)
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = Field(default=None, max_length=255)
    attendance_notes: Optional[str] = Field(default=None, max_length=500)
    attendee_count: int = Field(default=0, ge=0)


class GroupCountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    attendance_group_id: int
    count: int


class EventInstanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_series_id: int
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str]
    attendance_notes: Optional[str]
    attendee_count: int
    # Denormalized from parent series for frontend convenience
    series_name: Optional[str] = None
    attendance_type: Optional[AttendanceType] = None
    tags: list[EventTagResponse] = Field(default_factory=list)
    group_counts: list[GroupCountResponse] = Field(default_factory=list)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        # Populate denormalized fields from the joined series relationship
        if hasattr(obj, "series") and obj.series is not None:
            instance.series_name = obj.series.name
            instance.attendance_type = obj.series.attendance_type
            instance.tags = [
                EventTagResponse(id=t.event_tag.id, name=t.event_tag.name, color=t.event_tag.color)
                for t in (obj.series.tags or [])
            ]
        return instance
