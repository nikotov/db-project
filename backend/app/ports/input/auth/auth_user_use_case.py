from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class AuthUserCommand:
    
    username: str
    password: str

@dataclass
class AuthUserResult:

    access_token: str
    token_type: str = "bearer"

class AuthUserUseCase(ABC):
    @abstractmethod
    def execute(self, command: AuthUserCommand) -> AuthUserResult: ...