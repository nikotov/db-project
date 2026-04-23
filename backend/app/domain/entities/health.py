"""Domain entity for service health."""
from dataclasses import dataclass


@dataclass(frozen=True)
class HealthStatus:
    """Represents service health status."""

    status: str
