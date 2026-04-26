from dataclasses import dataclass
from datetime import datetime, timezone

from app.ports.input.auth.register_user_use_case import (
    AuthResult,
    RegisterUserCommand,
    RegisterUserUseCase,
)

from app.ports.input.auth.auth_user_use_case import(
    AuthUserCommand,
    AuthUserUseCase,
    AuthUserResult
)

from app.ports.output.password_hasher_port import PasswordHasherPort
from app.ports.output.token_service import TokenServicePort
from app.ports.output.user_log_writer_port import UserLogWriterPort
from app.ports.output.user_account_repository_port import UserAccountRepositoryPort

class UsernameAlreadyExistsException(ValueError):
    pass

class InvalidCredentialsException(ValueError):
    pass

@dataclass
class AuthService:
    user_repo: UserAccountRepositoryPort
    password_hasher: PasswordHasherPort
    token_service: TokenServicePort
    user_log_writer: UserLogWriterPort | None = None

    def register(self, command: RegisterUserCommand) -> AuthResult:
        if self.user_repo.exists_by_username(command.username):
            raise UsernameAlreadyExistsException(f"Username '{command.username}' is already taken.")
        
        password_hash = self.password_hasher.hash_password(command.password)
        user_id = self.user_repo.create(command.username, password_hash)

        now = datetime.now(timezone.utc)
        self.user_repo.update_last_login(user_id, now)

        if self.user_log_writer is not None:
            self.user_log_writer.log(
                user_id=user_id,
                action="register",
                metadata={"username": command.username, "timestamp": now.isoformat()}
            )
        
        token = self.token_service.create_access_token(
            subject=command.username,
            claims={"username": command.username, "role": "member"},
        )

        return AuthResult(access_token=token)
    
    def authenticate(self, command: AuthUserCommand) -> AuthUserResult:
        password_hash = self.user_repo.get_password_hash(command.username)
        if password_hash is None or not self.password_hasher.verify_password(command.password, password_hash):
            if self.user_log_writer is not None:
                self.user_log_writer.log(
                    user_id=None,
                    action="failed_login",
                    metadata={"username": command.username, "timestamp": datetime.now(timezone.utc).isoformat()}
                )
            raise InvalidCredentialsException("Invalid username or password.")
        
        user_id = self.user_repo.get_user_id_by_username(command.username)
        if user_id is None:
            raise InvalidCredentialsException("Invalid username or password.")
        role = self.user_repo.get_role_by_username(command.username) or "member"
        now = datetime.now(timezone.utc)
        self.user_repo.update_last_login(user_id, now)

        if self.user_log_writer is not None:
            self.user_log_writer.log(
                user_id=user_id,
                action="login",
                metadata={"username": command.username, "timestamp": now.isoformat()},
            )
        
        token = self.token_service.create_access_token(
            subject=command.username,
            claims={"username": command.username, "role": role},
        )

        return AuthUserResult(access_token=token)