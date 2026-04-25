"""HTTP routes for group memberships."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.small_group import GroupMembershipCreate, GroupMembershipResponse
from app.adapters.output.persistence.models import GroupMembership, GroupMembershipStatusEnum
from app.database import get_db

router = APIRouter(prefix="/group-memberships", tags=["group-memberships"])


@router.get("", response_model=list[GroupMembershipResponse])
def list_memberships(
    group_id: int | None = Query(default=None),
    member_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    q = db.query(GroupMembership)
    if group_id is not None:
        q = q.filter(GroupMembership.small_group_id == group_id)
    if member_id is not None:
        q = q.filter(GroupMembership.member_id == member_id)
    return q.order_by(GroupMembership.id).all()


@router.post("", response_model=GroupMembershipResponse, status_code=status.HTTP_201_CREATED)
def create_membership(payload: GroupMembershipCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    membership = GroupMembership(
        member_id=payload.member_id,
        small_group_id=payload.small_group_id,
        role=GroupMembershipStatusEnum(payload.role.value),
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.delete("/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_membership(membership_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    membership = db.get(GroupMembership, membership_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
    db.delete(membership)
    db.commit()
