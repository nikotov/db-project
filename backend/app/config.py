"""Application configuration."""
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql://app_user:app_password@localhost:5432/app_db"
    
    # FastAPI
    api_title: str = "Backend API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # Auth
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

settings = Settings()
