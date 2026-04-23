"""Main HTTP router composition."""
from fastapi import APIRouter

from app.adapters.input.http.routes import auth, health

router = APIRouter()
router.include_router(health.router, tags=["health"])
router.include_router(auth.router, tags=["auth"])
