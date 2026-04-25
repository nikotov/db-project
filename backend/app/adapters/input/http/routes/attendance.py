"""HTTP routes for attendance (general and individual)."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.adapters.input.http.deps import get_current_user
from app.adapters.input.http.schemas.attendance import (
    AttendanceGroupCreate,
    AttendanceGroupResponse,
    GeneralAttendanceUpsert,
    MemberAttendanceUpsert,
    MemberAttendanceResponse,
)
from app.adapters.output.persistence.models import (
    AttendanceGroup,
    EventInstance,
    EventInstanceGroupCount,
    EventMemberAttendance,
    MemberAttendanceStatusEnum,
    MemberRegistrationStatusEnum,
)
from app.database import get_db

router = APIRouter(tags=["attendance"])


# Attendance Groups 

@router.get("/attendance-groups", response_model=list[AttendanceGroupResponse])
def list_attendance_groups(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    return db.query(AttendanceGroup).order_by(AttendanceGroup.id).all()


@router.post("/attendance-groups", response_model=AttendanceGroupResponse, status_code=status.HTTP_201_CREATED)
def create_attendance_group(payload: AttendanceGroupCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    group = AttendanceGroup(name=payload.name, description=payload.description)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.delete("/attendance-groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance_group(group_id: int, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    group = db.get(AttendanceGroup, group_id)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance group not found")
    db.delete(group)
    db.commit()


# General Attendance 

@router.post("/attendance/general", status_code=status.HTTP_200_OK)
def upsert_general_attendance(
    payload: GeneralAttendanceUpsert,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Set total headcount + breakdown by group for an event instance."""
    instance = db.get(EventInstance, payload.event_instance_id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event instance not found")

    instance.attendee_count = payload.attendee_count

    for gc in payload.group_counts:
        existing = (
            db.query(EventInstanceGroupCount)
            .filter(
                EventInstanceGroupCount.event_instance_id == payload.event_instance_id,
                EventInstanceGroupCount.attendance_group_id == gc.attendance_group_id,
            )
            .first()
        )
        if existing:
            existing.count = gc.count
        else:
            db.add(EventInstanceGroupCount(
                event_instance_id=payload.event_instance_id,
                attendance_group_id=gc.attendance_group_id,
                count=gc.count,
            ))

    db.commit()
    return {"ok": True, "event_instance_id": payload.event_instance_id}


# Individual / Member Attendance 

@router.get("/attendance/members", response_model=list[MemberAttendanceResponse])
def list_member_attendance(
    event_instance_id: int | None = Query(default=None),
    member_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    q = db.query(EventMemberAttendance)
    if event_instance_id is not None:
        q = q.filter(EventMemberAttendance.event_instance_id == event_instance_id)
    if member_id is not None:
        q = q.filter(EventMemberAttendance.member_id == member_id)
    return q.all()


@router.post("/attendance/member", response_model=MemberAttendanceResponse)
def upsert_member_attendance(
    payload: MemberAttendanceUpsert,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    """Register or update a single member's attendance for an event instance."""
    existing = (
        db.query(EventMemberAttendance)
        .filter(
            EventMemberAttendance.event_instance_id == payload.event_instance_id,
            EventMemberAttendance.member_id == payload.member_id,
        )
        .first()
    )
    if existing:
        existing.attendance_status = MemberAttendanceStatusEnum(payload.attendance_status.value)
        existing.registration_status = MemberRegistrationStatusEnum(payload.registration_status.value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        record = EventMemberAttendance(
            event_instance_id=payload.event_instance_id,
            member_id=payload.member_id,
            attendance_status=MemberAttendanceStatusEnum(payload.attendance_status.value),
            registration_status=MemberRegistrationStatusEnum(payload.registration_status.value),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


@router.delete("/attendance/member", status_code=status.HTTP_204_NO_CONTENT)
def delete_member_attendance(
    event_instance_id: int = Query(...),
    member_id: int = Query(...),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    record = (
        db.query(EventMemberAttendance)
        .filter(
            EventMemberAttendance.event_instance_id == event_instance_id,
            EventMemberAttendance.member_id == member_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    