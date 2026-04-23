from abc import ABC, abstractmethod
from datetime import datetime

class PasswordHasherPort(ABC):

    @abstractmethod
    def hash_password(self, password: str) -> str: ...
    @abstractmethod
    def verify_password(self, plain_password: str, hashed_password: str) -> bool: ...