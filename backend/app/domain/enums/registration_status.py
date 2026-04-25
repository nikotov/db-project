from enum import Enum


class RegistrationStatus(str, Enum):
    REGISTERED = "registered"
    CANCELLED = "cancelled"
    WAITLISTED = "waitlisted"
    UNKNOWN = "unknown"

    def __str__(self) -> str:
        return self.value