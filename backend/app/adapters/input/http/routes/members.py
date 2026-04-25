"""HTTP route adapter for member endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.adapters.input.http.schemas.member import (
    MemberCountResponse,
    MemberCreateRequest,
    MemberResponse,
)
from app.adapters.output.persistence.sqlalchemy_member_repository import SQLAlchemyMemberRepository
from app.database import get_db
from app.domain.entities.member import Member
from app.domain.services.member_service import MemberNotFoundException, MemberService

router = APIRouter()


def get_member_service(db: Session = Depends(get_db)) -> MemberService:
    """Resolve member service dependency."""
    return MemberService(member_repo=SQLAlchemyMemberRepository(db))


@router.get("/members/count", response_model=MemberCountResponse)
def count_members(
    member_service: MemberService = Depends(get_member_service),
) -> MemberCountResponse:
    """Return current number of members."""
    total = member_service.count_members()
    return MemberCountResponse(total=total)


@router.get("/members", response_model=list[MemberResponse])
def list_members(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    member_service: MemberService = Depends(get_member_service),
) -> list[MemberResponse]:
    """List members with basic pagination."""
    members = member_service.list_members(limit=limit, offset=offset)
    return [MemberResponse.model_validate(member) for member in members]


@router.get("/members/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: int,
    member_service: MemberService = Depends(get_member_service),
) -> MemberResponse:
    """Return one member by ID."""
    try:
        member = member_service.get_member(member_id)
        return MemberResponse.model_validate(member)
    except MemberNotFoundException as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    
@router.post("/members", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    payload: MemberCreateRequest,
    member_service: MemberService = Depends(get_member_service),
) -> MemberResponse:
    """Create a new member."""
    try:
        now = datetime.now(timezone.utc)
        member = Member(
            id=0,
            name=payload.name,
            middle_name=payload.middle_name,
            last_name_parental=payload.last_name_parental,
            last_name_maternal=payload.last_name_maternal,
            address=payload.address,
            birth_date=payload.birth_date,
            gender=payload.gender,
            phone=payload.phone,
            email=payload.email,
            created_at=now,
            updated_at=None,
            marital_status=payload.marital_status,
            family_role=payload.family_role,
            is_baptized=payload.is_baptized,
            baptized_location=payload.baptized_location,
            member_status_id=payload.member_status_id,
            family_id=payload.family_id,
        )
        member_id = member_service.create_member(member)
        created = member_service.get_member(member_id)
        return MemberResponse.model_validate(created)

    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    
@router.put("/members/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    payload: MemberCreateRequest,
    member_service: MemberService = Depends(get_member_service),
) -> MemberResponse:
    """Update an existing member."""
    try:
        existing = member_service.get_member(member_id)
        now = datetime.now(timezone.utc)
        member = Member(
            id=member_id,
            name=payload.name,
            middle_name=payload.middle_name,
            last_name_parental=payload.last_name_parental,
            last_name_maternal=payload.last_name_maternal,
            address=payload.address,
            birth_date=payload.birth_date,
            gender=payload.gender,
            phone=payload.phone,
            email=payload.email,
            created_at=existing.created_at,
            updated_at=now,
            marital_status=payload.marital_status,
            family_role=payload.family_role,
            is_baptized=payload.is_baptized,
            baptized_location=payload.baptized_location,
            member_status_id=payload.member_status_id,
            family_id=payload.family_id,
        )
        member_service.update_member(member)
        updated = member_service.get_member(member_id)
        return MemberResponse.model_validate(updated)
    except MemberNotFoundException as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    
@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: int,
    member_service: MemberService = Depends(get_member_service),
) -> None:
    """Delete a member by ID."""
    try:
        member_service.delete_member(member_id)
    except MemberNotFoundException as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc