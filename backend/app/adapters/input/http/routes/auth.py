"""HTTP route adapter for authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.adapters.input.http.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.adapters.output.persistence.sqlalchemy_user_account_repository import (
    SQLAlchemyUserAccountRepository,
)
from app.adapters.output.persistence.sqlalchemy_user_log_writer import SQLAlchemyUserLogWriter
from app.adapters.output.security.jwt_token_service import JWTTokenService
from app.adapters.output.security.pbkdf2_password_hasher import PBKDF2PasswordHasher
from app.database import get_db
from app.domain.services.auth_service import (
    AuthService,
    InvalidCredentialsException,
    UsernameAlreadyExistsException,
)
from app.ports.input.auth.auth_user_use_case import AuthUserCommand
from app.ports.input.auth.register_user_use_case import RegisterUserCommand

router = APIRouter()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Resolve auth service dependency."""
    return AuthService(
        user_repo=SQLAlchemyUserAccountRepository(db),
        password_hasher=PBKDF2PasswordHasher(),
        token_service=JWTTokenService(),
        user_log_writer=SQLAlchemyUserLogWriter(db),
    )


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Register a new user and return an access token."""
    try:
        result = auth_service.register(
            RegisterUserCommand(username=payload.username, password=payload.password)
        )
        return TokenResponse(access_token=result.access_token, token_type=result.token_type)
    except UsernameAlreadyExistsException as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post("/auth/login", response_model=TokenResponse)
def login_user(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authenticate a user and return an access token."""
    try:
        result = auth_service.authenticate(
            AuthUserCommand(username=payload.username, password=payload.password)
        )
        return TokenResponse(access_token=result.access_token, token_type=result.token_type)
    except InvalidCredentialsException as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        ) from exc
