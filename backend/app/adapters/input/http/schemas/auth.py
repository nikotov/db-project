"""HTTP schemas for authentication routes."""
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
	"""Payload for user registration."""

	username: str = Field(min_length=3, max_length=45)
	password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
	"""Payload for user authentication."""

	username: str = Field(min_length=3, max_length=45)
	password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
	"""Standard bearer token response."""

	access_token: str
	token_type: str = "bearer"
