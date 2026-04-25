"""Main HTTP router composition."""
from fastapi import APIRouter

from app.adapters.input.http.routes import auth, health, members

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(auth.router, tags=["auth"])
router.include_router(members.router, tags=["members"])
