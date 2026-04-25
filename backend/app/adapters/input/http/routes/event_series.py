"""HTTP routes for event series."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.event_series import (
    EventSeriesCreate,
    EventSeriesResponse,
    EventTagResponse,
)
from app.adapters.output.persistence.models import (
    EventSeries,
    EventSeriesTagMap,
    EventTag,
    EventAttendanceTypeEnum,
    EventSeriesStatusEnum,
    RecurrenceTypeEnum,
)
from app.database import get_db

router = APIRouter(prefix="/event-series", tags=["event-series"])


def _to_response(series: EventSeries) -> EventSeriesResponse:
    tags = [
        EventTagResponse(id=m.event_tag.id, name=m.event_tag.name, color=m.event_tag.color)
        for m in (series.tags or [])
    ]
    return EventSeriesResponse(
        id=series.id,
        name=series.name,
        description=series.description,
        attendance_type=series.attendance_type.value,
        recurrence_type=series.recurrence_type.value,
        recurrence_rule=series.recurrence_rule,
        status=series.status.value,
        location=series.location,
        start_time=series.start_time,
        end_time=series.end_time,
        created_at=series.created_at,
        updated_at=series.updated_at,
        tags=tags,
    )


@router.get("", response_model=list[EventSeriesResponse])
def list_event_series(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    rows = db.query(EventSeries).order_by(EventSeries.id).all()
    return [_to_response(r) for r in rows]


@router.post("", response_model=EventSeriesResponse, status_code=status.HTTP_201_CREATED)
def create_event_series(payload: EventSeriesCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    series = EventSeries(
        name=payload.name,
        description=payload.description,
        attendance_type=EventAttendanceTypeEnum(payload.attendance_type.value),
        recurrence_type=RecurrenceTypeEnum(payload.recurrence_type.value),
        recurrence_rule=payload.recurrence_rule,
        status=EventSeriesStatusEnum(payload.status.value),
        location=payload.location,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    db.add(series)
    db.flush()
    for tag_id in payload.tag_ids:
        db.add(EventSeriesTagMap(event_series_id=series.id, event_tag_id=tag_id))
    db.commit()
    db.refresh(series)
    return _to_response(series)


@router.get("/{series_id}", response_model=EventSeriesResponse)
def get_event_series(series_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    series = db.get(EventSeries, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event series not found")
    return _to_response(series)


@router.put("/{series_id}", response_model=EventSeriesResponse)
def update_event_series(series_id: int, payload: EventSeriesCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    series = db.get(EventSeries, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event series not found")
    series.name = payload.name
    series.description = payload.description
    series.attendance_type = EventAttendanceTypeEnum(payload.attendance_type.value)
    series.recurrence_type = RecurrenceTypeEnum(payload.recurrence_type.value)
    series.recurrence_rule = payload.recurrence_rule
    series.status = EventSeriesStatusEnum(payload.status.value)
    series.location = payload.location
    series.start_time = payload.start_time
    series.end_time = payload.end_time
    # Replace tags
    db.query(EventSeriesTagMap).filter(EventSeriesTagMap.event_series_id == series_id).delete()
    for tag_id in payload.tag_ids:
        db.add(EventSeriesTagMap(event_series_id=series_id, event_tag_id=tag_id))
    db.commit()
    db.refresh(series)
    return _to_response(series)


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_series(series_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    series = db.get(EventSeries, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event series not found")
    db.delete(series)
    db.commit()
