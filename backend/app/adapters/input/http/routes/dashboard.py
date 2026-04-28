from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.adapters.input.http.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user),
):
    # Query each view using raw SQL
    members = db.execute(text("SELECT total FROM v_total_members")).scalar() or 0
    families = db.execute(text("SELECT total FROM v_total_families")).scalar() or 0
    groups = db.execute(text("SELECT total FROM v_active_small_groups")).scalar() or 0
    upcoming = db.execute(text("SELECT total FROM v_upcoming_events")).scalar() or 0

    # The attendance view returns two columns
    attendance_row = db.execute(
        text("SELECT last_sunday_service_attendance, last_week_small_group_attendance FROM v_recent_attendance")
    ).first()
    sunday_att = attendance_row.last_sunday_service_attendance if attendance_row else 0
    week_att = attendance_row.last_week_small_group_attendance if attendance_row else 0

    income = 0   # placeholder – replace when you have a financial table

    return {
        "membersCount": members,
        "familiesCount": families,
        "smallGroupsCount": groups,
        "upcomingEventsCount": upcoming,
        "lastSundayServiceAttendance": sunday_att,
        "lastWeekSmallGroupAttendance": week_att,
        "income": income,
    }