"""HTTP schemas for event-series, event-instance and event-tag routes."""
from datetime import date, time
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.adapters.input.http.schemas.base import UtcDatetime

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
    created_at: UtcDatetime
    updated_at: Optional[UtcDatetime]
    tags: list[EventTagResponse] = Field(default_factory=list)


# Event Instance 

# Generate Instances

class EventSeriesGenerateInstancesRequest(BaseModel):
    from_date: date
    to_date: date


class EventInstanceCreate(BaseModel):
    event_series_id: int = Field(ge=1)
    start_datetime: UtcDatetime
    end_datetime: UtcDatetime
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
    start_datetime: UtcDatetime
    end_datetime: UtcDatetime
    location: Optional[str]
    attendance_notes: Optional[str]
    attendee_count: int
    # Denormalized from parent series for frontend convenience
    series_name: Optional[str] = None
    attendance_type: Optional[AttendanceType] = None
    tags: list[EventTagResponse] = Field(default_factory=list)
    group_counts: list[GroupCountResponse] = Field(default_factory=list)

    @model_validator(mode="wrap")
    @classmethod
    def _populate_series_fields(cls, obj: Any, handler: Any) -> "EventInstanceResponse":
        # Run the standard Pydantic validation first (maps ORM columns → fields)
        instance: EventInstanceResponse = handler(obj)
        # Then pull denormalized fields from the joined `series` relationship.
        # This runs for *every* validation path (single object, list, nested),
        # unlike the old `model_validate` classmethod override which was
        # bypassed by Pydantic's internal list validator.
        if hasattr(obj, "series") and obj.series is not None:
            instance.series_name = obj.series.name
            instance.attendance_type = obj.series.attendance_type
            instance.tags = [
                EventTagResponse(id=t.event_tag.id, name=t.event_tag.name, color=t.event_tag.color)
                for t in (obj.series.tags or [])
            ]
        return instance