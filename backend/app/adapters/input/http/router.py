"""Main HTTP router composition."""
from fastapi import APIRouter

from app.adapters.input.http.routes import auth, health, members
from app.adapters.input.http.routes import (
    event_tags,
    event_series,
    event_instances,
    small_groups,
    small_group_tags,
    group_memberships,
    attendance,
    families,
    member_status,
    user_logs,
    users,
)

router = APIRouter()

# Core
router.include_router(health.router, tags=["health"])
router.include_router(auth.router, tags=["auth"])
router.include_router(members.router, tags=["members"])

# Events
router.include_router(event_tags.router)
router.include_router(event_series.router)
router.include_router(event_instances.router)

# Small groups
router.include_router(small_groups.router)
router.include_router(small_group_tags.router)
router.include_router(group_memberships.router)

# Attendance
router.include_router(attendance.router)

# Catalogs
router.include_router(families.router)
router.include_router(member_status.router)

# Admin / audit
router.include_router(user_logs.router)
router.include_router(users.router)
