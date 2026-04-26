"""Application configuration."""
from typing import Literal

from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from pydantic import model_validator


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql://app_user:app_password@localhost:5432/app_db"
    
    # FastAPI
    api_title: str = "Backend API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    app_env: Literal["development", "test", "production"] = "development"

    # Auth
    jwt_secret_key: str = "dev-insecure-jwt-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    cors_allow_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @model_validator(mode="after")
    def _validate_production_security(self) -> "Settings":
        if (
            self.app_env == "production"
            and self.jwt_secret_key == "dev-insecure-jwt-secret-change-me"
        ):
            raise ValueError("Set JWT_SECRET_KEY in production.")
        return self

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allow_origins.split(",")
            if origin.strip()
        ]

settings = Settings()
