"""Input port for health use case."""
from abc import ABC, abstractmethod

from app.domain.entities.health import HealthStatus


class HealthUseCase(ABC):
    """Contract for health-check use case."""

    @abstractmethod
    def get_status(self) -> HealthStatus:
        """Return service health status."""
