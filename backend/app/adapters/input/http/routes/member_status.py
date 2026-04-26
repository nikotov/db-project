"""HTTP routes for member-status catalog."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user, require_roles
from app.adapters.input.http.schemas.catalog import MemberStatusCreate, MemberStatusResponse
from app.adapters.output.persistence.models import MemberStatus
from app.database import get_db

router = APIRouter(prefix="/member-status", tags=["member-status"])


@router.get("", response_model=list[MemberStatusResponse])
def list_member_statuses(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    return db.query(MemberStatus).order_by(MemberStatus.id).all()


@router.post("", response_model=MemberStatusResponse, status_code=status.HTTP_201_CREATED)
def create_member_status(payload: MemberStatusCreate, db: Session = Depends(get_db), _: str = Depends(require_roles("admin"))):
    ms = MemberStatus(name=payload.name)
    db.add(ms)
    db.commit()
    db.refresh(ms)
    return ms


@router.get("/{status_id}", response_model=MemberStatusResponse)
def get_member_status(status_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    ms = db.get(MemberStatus, status_id)
    if not ms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member status not found")
    return ms


@router.put("/{status_id}", response_model=MemberStatusResponse)
def update_member_status(status_id: int, payload: MemberStatusCreate, db: Session = Depends(get_db), _: str = Depends(require_roles("admin"))):
    ms = db.get(MemberStatus, status_id)
    if not ms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member status not found")
    ms.name = payload.name
    db.commit()
    db.refresh(ms)
    return ms


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member_status(status_id: int, db: Session = Depends(get_db), _: str = Depends(require_roles("admin"))):
    ms = db.get(MemberStatus, status_id)
    if not ms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member status not found")
    db.delete(ms)
    db.commit()
