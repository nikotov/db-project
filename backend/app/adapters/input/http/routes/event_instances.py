"""HTTP routes for event instances."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.event_series import EventInstanceCreate, EventInstanceResponse
from app.adapters.output.persistence.models import EventInstance
from app.database import get_db

router = APIRouter(prefix="/event-instances", tags=["event-instances"])


@router.get("", response_model=list[EventInstanceResponse])
def list_event_instances(
    series_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    q = db.query(EventInstance)
    if series_id is not None:
        q = q.filter(EventInstance.event_series_id == series_id)
    rows = q.order_by(EventInstance.start_datetime.desc()).offset(offset).limit(limit).all()
    return rows


@router.post("", response_model=EventInstanceResponse, status_code=status.HTTP_201_CREATED)
def create_event_instance(payload: EventInstanceCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    instance = EventInstance(
        event_series_id=payload.event_series_id,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        location=payload.location,
        attendance_notes=payload.attendance_notes,
        attendee_count=payload.attendee_count,
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance


@router.get("/{instance_id}", response_model=EventInstanceResponse)
def get_event_instance(instance_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    instance = db.get(EventInstance, instance_id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event instance not found")
    return instance


@router.put("/{instance_id}", response_model=EventInstanceResponse)
def update_event_instance(instance_id: int, payload: EventInstanceCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    instance = db.get(EventInstance, instance_id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event instance not found")
    instance.event_series_id = payload.event_series_id
    instance.start_datetime = payload.start_datetime
    instance.end_datetime = payload.end_datetime
    instance.location = payload.location
    instance.attendance_notes = payload.attendance_notes
    instance.attendee_count = payload.attendee_count
    db.commit()
    db.refresh(instance)
    return instance


@router.delete("/{instance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_instance(instance_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    instance = db.get(EventInstance, instance_id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event instance not found")
    db.delete(instance)
    db.commit()
