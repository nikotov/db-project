from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class RegisterUserCommand:

    username: str
    password: str

@dataclass
class AuthResult:

    access_token: str
    token_type: str = "bearer"

class RegisterUserUseCase(ABC):
    @abstractmethod
    def execute(self, command: RegisterUserCommand) -> AuthResult: ...