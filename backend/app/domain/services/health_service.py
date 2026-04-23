"""Domain service for health checks."""
from app.domain.entities.health import HealthStatus
from app.ports.input.health_use_case import HealthUseCase


class HealthService(HealthUseCase):
    """Implements health-check use case."""

    def get_status(self) -> HealthStatus:
        return HealthStatus(status="ok")
