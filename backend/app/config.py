"""Application configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/postgres"
    
    # FastAPI
    api_title: str = "Backend API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    class Config:
        env_file = ".env"


settings = Settings()
