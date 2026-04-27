"""HTTP routes for user administration (admin only)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import AuthenticatedUser, require_roles
from app.adapters.input.http.schemas.users import (
    UserCreateRequest,
    UserResponse,
    UserUpdateRequest,
)
from app.adapters.output.persistence.models import UserAccount
from app.adapters.output.persistence.sqlalchemy_user_log_writer import SQLAlchemyUserLogWriter
from app.adapters.output.security.pbkdf2_password_hasher import PBKDF2PasswordHasher
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    _: AuthenticatedUser = Depends(require_roles("admin")),
):
    return (
        db.query(UserAccount)
        .order_by(UserAccount.created_at.desc(), UserAccount.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    principal: AuthenticatedUser = Depends(require_roles("admin")),
):
    username = payload.username.strip().lower()
    role = payload.role.strip().lower()
    if role not in {"admin", "member"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role.")

    exists = db.query(UserAccount.id).filter(UserAccount.username == username).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")

    password_hasher = PBKDF2PasswordHasher()
    user = UserAccount(
        username=username,
        password_hash=password_hasher.hash_password(payload.password),
        role=role,
    )
    db.add(user)
    db.flush()
    db.commit()
    db.refresh(user)
    SQLAlchemyUserLogWriter(db).log(
        user_id=db.query(UserAccount.id).filter(UserAccount.username == principal.username).scalar(),
        action="create_user",
        metadata={"created_username": username, "role": role},
    )
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    principal: AuthenticatedUser = Depends(require_roles("admin")),
):
    user = db.get(UserAccount, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    username = payload.username.strip().lower()
    role = payload.role.strip().lower()
    if role not in {"admin", "member"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role.")

    duplicate = db.query(UserAccount.id).filter(UserAccount.username == username, UserAccount.id != user_id).first()
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")

    user.username = username
    user.role = role
    if payload.password and payload.password.strip():
        user.password_hash = PBKDF2PasswordHasher().hash_password(payload.password)
    db.commit()
    db.refresh(user)

    SQLAlchemyUserLogWriter(db).log(
        user_id=db.query(UserAccount.id).filter(UserAccount.username == principal.username).scalar(),
        action="update_user",
        metadata={"updated_user_id": user_id, "username": username, "role": role},
    )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    principal: AuthenticatedUser = Depends(require_roles("admin")),
):
    actor = db.query(UserAccount).filter(UserAccount.username == principal.username).first()
    if actor and actor.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own user.")

    user = db.get(UserAccount, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    deleted_username = user.username
    db.delete(user)
    db.commit()

    SQLAlchemyUserLogWriter(db).log(
        user_id=actor.id if actor else None,
        action="delete_user",
        metadata={"deleted_user_id": user_id, "deleted_username": deleted_username},
    )
