"""HTTP routes for event tags."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.event_series import EventTagCreate, EventTagResponse
from app.adapters.output.persistence.models import EventTag
from app.database import get_db

router = APIRouter(prefix="/event-tags", tags=["event-tags"])


@router.get("", response_model=list[EventTagResponse])
def list_event_tags(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    return db.query(EventTag).order_by(EventTag.id).all()


@router.post("", response_model=EventTagResponse, status_code=status.HTTP_201_CREATED)
def create_event_tag(payload: EventTagCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = EventTag(name=payload.name, color=payload.color)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.get("/{tag_id}", response_model=EventTagResponse)
def get_event_tag(tag_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = db.get(EventTag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event tag not found")
    return tag


@router.put("/{tag_id}", response_model=EventTagResponse)
def update_event_tag(tag_id: int, payload: EventTagCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = db.get(EventTag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event tag not found")
    tag.name = payload.name
    tag.color = payload.color
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_tag(tag_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = db.get(EventTag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event tag not found")
    db.delete(tag)
    db.commit()
