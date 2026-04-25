"""HTTP routes for user logs (read-only, admin)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.user_logs import UserLogResponse
from app.adapters.output.persistence.models import UserLogs, UserAccount
from app.database import get_db

router = APIRouter(prefix="/user-logs", tags=["user-logs"])


@router.get("", response_model=list[UserLogResponse])
def list_user_logs(
    user_id: int | None = Query(default=None, description="Filter by user ID"),
    action_type: str | None = Query(default=None, description="Filter by action type"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    # List audit log entries. Optionally filter by user or action type
    q = db.query(UserLogs)
    if user_id is not None:
        q = q.filter(UserLogs.user_id == user_id)
    if action_type is not None:
        q = q.filter(UserLogs.action_type == action_type)
    return q.order_by(UserLogs.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/me", response_model=list[UserLogResponse])
def list_my_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    # Return log entries for the currently authenticated user
    user = db.query(UserAccount).filter(UserAccount.username == current_user).first()
    if not user:
        return []
    logs = (
        db.query(UserLogs)
        .filter(UserLogs.user_id == user.id)
        .order_by(UserLogs.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return logs
