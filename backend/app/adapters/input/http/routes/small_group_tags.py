"""HTTP routes for small group tags."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.small_group import SmallGroupTagCreate, SmallGroupTagResponse
from app.adapters.output.persistence.models import SmallGroupTag
from app.database import get_db

router = APIRouter(prefix="/small-group-tags", tags=["small-group-tags"])


@router.get("", response_model=list[SmallGroupTagResponse])
def list_small_group_tags(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    return db.query(SmallGroupTag).order_by(SmallGroupTag.id).all()


@router.post("", response_model=SmallGroupTagResponse, status_code=status.HTTP_201_CREATED)
def create_small_group_tag(payload: SmallGroupTagCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = SmallGroupTag(name=payload.name, color=payload.color)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.get("/{tag_id}", response_model=SmallGroupTagResponse)
def get_small_group_tag(tag_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = db.get(SmallGroupTag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return tag


@router.put("/{tag_id}", response_model=SmallGroupTagResponse)
def update_small_group_tag(tag_id: int, payload: SmallGroupTagCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = db.get(SmallGroupTag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    tag.name = payload.name
    tag.color = payload.color
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_small_group_tag(tag_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    tag = db.get(SmallGroupTag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    db.delete(tag)
    db.commit()
