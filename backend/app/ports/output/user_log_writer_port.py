from abc import ABC, abstractmethod
from datetime import datetime

class UserLogWriterPort(ABC):

    @abstractmethod
    def log(self, user_id: int | None, action: str, metadata: dict | None = None) -> None: ...