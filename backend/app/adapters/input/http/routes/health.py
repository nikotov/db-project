"""HTTP route adapter for health endpoint."""
from fastapi import APIRouter

from app.domain.services.health_service import HealthService

router = APIRouter()
health_service = HealthService()


@router.get("/health")
def health_check():
    """Expose health status via HTTP."""
    health = health_service.get_status()
    return {"status": health.status}
