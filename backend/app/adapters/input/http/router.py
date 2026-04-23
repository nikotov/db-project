"""Main HTTP router composition."""
from fastapi import APIRouter

from app.adapters.input.http.routes import health

router = APIRouter()
router.include_router(health.router, tags=["health"])
