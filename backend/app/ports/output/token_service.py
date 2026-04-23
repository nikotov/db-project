from abc import ABC, abstractmethod
from datetime import datetime, timedelta

class TokenServicePort(ABC):
    @abstractmethod
    def create_access_token(self, subject: str, claims: dict | None = None, expires_delta: timedelta | None = None) -> str: ...