"""HTTP routes for event series."""
from datetime import datetime, timedelta, date
from typing import Optional
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.event_series import (
    EventSeriesCreate,
    EventSeriesGenerateInstancesRequest,
    EventSeriesResponse,
    EventTagResponse,
)
from app.adapters.output.persistence.models import (
    EventSeries,
    EventSeriesTagMap,
    EventInstance,
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


def _generate_occurrences(
    recurrence_type: RecurrenceTypeEnum,
    start_date: date,
    end_date: date,
) -> list[date]:
    """Generate all occurrence dates between start_date and end_date (inclusive)."""
    occurrences = []
    current = start_date

    if recurrence_type == RecurrenceTypeEnum.daily:
        delta = timedelta(days=1)
        while current <= end_date:
            occurrences.append(current)
            current += delta

    elif recurrence_type == RecurrenceTypeEnum.weekly:
        delta = timedelta(weeks=1)
        while current <= end_date:
            occurrences.append(current)
            current += delta

    elif recurrence_type == RecurrenceTypeEnum.monthly:
        while current <= end_date:
            occurrences.append(current)
            current += relativedelta(months=1)

    elif recurrence_type == RecurrenceTypeEnum.yearly:
        while current <= end_date:
            occurrences.append(current)
            current += relativedelta(years=1)

    return occurrences


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


@router.post("/{series_id}/generate-instances", status_code=status.HTTP_201_CREATED)
def generate_instances(
    series_id: int,
    payload: EventSeriesGenerateInstancesRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """
    Generate EventInstance records for a recurring EventSeries between
    `from_date` and `to_date` (inclusive).

    - Skips dates that already have an instance for this series.
    - Returns a summary with the number of instances created and skipped.
    - Only works for recurrence_type in: daily, weekly, monthly, yearly.
    - Returns 400 for series with recurrence_type=none.
    """
    series = db.get(EventSeries, series_id)
    if not series:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event series not found")

    if series.recurrence_type == RecurrenceTypeEnum.none:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate instances for a non-recurring series (recurrence_type='none'). Create instances manually.",
        )

    if not series.start_time or not series.end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Series must have start_time and end_time set before generating instances.",
        )

    from_date = payload.from_date
    to_date = payload.to_date

    if to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="to_date must be >= from_date.",
        )

    # Find existing instance dates to avoid duplicates
    existing_instances = (
        db.query(EventInstance)
        .filter(EventInstance.event_series_id == series_id)
        .all()
    )
    existing_dates = {inst.start_datetime.date() for inst in existing_instances}

    occurrences = _generate_occurrences(series.recurrence_type, from_date, to_date)

    created_count = 0
    skipped_count = 0

    for occ_date in occurrences:
        if occ_date in existing_dates:
            skipped_count += 1
            continue

        start_dt = datetime.combine(occ_date, series.start_time)
        end_dt = datetime.combine(occ_date, series.end_time)

        # If end_time is before start_time, the event crosses midnight — add one day
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)

        instance = EventInstance(
            event_series_id=series_id,
            start_datetime=start_dt,
            end_datetime=end_dt,
            location=series.location,
            attendance_notes=None,
            attendee_count=0,
        )
        db.add(instance)
        created_count += 1

    db.commit()

    return {
        "series_id": series_id,
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
        "created": created_count,
        "skipped": skipped_count,
        "total_occurrences": len(occurrences),
    }