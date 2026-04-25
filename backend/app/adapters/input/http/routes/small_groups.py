"""HTTP routes for small groups."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.small_group import (
    SmallGroupCreate,
    SmallGroupResponse,
    SmallGroupTagResponse,
)
from app.adapters.output.persistence.models import (
    SmallGroup,
    SmallGroupTagMap,
    DayOfWeekEnum,
    SmallGroupStatusEnum,
)
from app.database import get_db

router = APIRouter(prefix="/small-groups", tags=["small-groups"])


def _to_response(group: SmallGroup) -> SmallGroupResponse:
    tags = [
        SmallGroupTagResponse(id=m.tag.id, name=m.tag.name, color=m.tag.color)
        for m in (group.tags or [])
    ]
    return SmallGroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        meeting_day=group.meeting_day.value,
        meeting_time=group.meeting_time,
        location=group.location,
        status=group.status.value,
        created_at=group.created_at,
        updated_at=group.updated_at,
        tags=tags,
    )


@router.get("", response_model=list[SmallGroupResponse])
def list_small_groups(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    rows = db.query(SmallGroup).order_by(SmallGroup.id).all()
    return [_to_response(r) for r in rows]


@router.post("", response_model=SmallGroupResponse, status_code=status.HTTP_201_CREATED)
def create_small_group(payload: SmallGroupCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    group = SmallGroup(
        name=payload.name,
        description=payload.description,
        meeting_day=DayOfWeekEnum(payload.meeting_day.value),
        meeting_time=payload.meeting_time,
        location=payload.location,
        status=SmallGroupStatusEnum(payload.status.value),
    )
    db.add(group)
    db.flush()
    for tag_id in payload.tag_ids:
        db.add(SmallGroupTagMap(small_group_id=group.id, tag_id=tag_id))
    db.commit()
    db.refresh(group)
    return _to_response(group)


@router.get("/{group_id}", response_model=SmallGroupResponse)
def get_small_group(group_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    group = db.get(SmallGroup, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Small group not found")
    return _to_response(group)


@router.put("/{group_id}", response_model=SmallGroupResponse)
def update_small_group(group_id: int, payload: SmallGroupCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    group = db.get(SmallGroup, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Small group not found")
    group.name = payload.name
    group.description = payload.description
    group.meeting_day = DayOfWeekEnum(payload.meeting_day.value)
    group.meeting_time = payload.meeting_time
    group.location = payload.location
    group.status = SmallGroupStatusEnum(payload.status.value)
    db.query(SmallGroupTagMap).filter(SmallGroupTagMap.small_group_id == group_id).delete()
    for tag_id in payload.tag_ids:
        db.add(SmallGroupTagMap(small_group_id=group_id, tag_id=tag_id))
    db.commit()
    db.refresh(group)
    return _to_response(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_small_group(group_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    group = db.get(SmallGroup, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Small group not found")
    db.delete(group)
    db.commit()
