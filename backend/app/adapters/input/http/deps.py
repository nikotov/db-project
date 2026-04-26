"""Shared HTTP dependencies."""
import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

_bearer = HTTPBearer(auto_error=True)


@dataclass(frozen=True)
class AuthenticatedUser:
    username: str
    role: str


def _b64url_decode(segment: str) -> bytes:
    padding = 4 - len(segment) % 4
    if padding != 4:
        segment += "=" * padding
    return base64.urlsafe_b64decode(segment)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    # Validate Bearer JWT and return username from claims.
    return get_current_principal(credentials).username


def get_current_principal(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> AuthenticatedUser:
    # Validate Bearer JWT and return principal claims.
    token = credentials.credentials
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    header_seg, payload_seg, sig_seg = parts
    signing_input = f"{header_seg}.{payload_seg}".encode("ascii")

    expected_sig = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    actual_sig = _b64url_decode(sig_seg)

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    try:
        payload = json.loads(_b64url_decode(payload_seg))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")

    exp = payload.get("exp")
    if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    username = payload.get("username") or payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject")
    role = payload.get("role") or "member"
    return AuthenticatedUser(username=str(username), role=str(role))


def require_roles(*allowed_roles: str):
    allowed = {role.strip().lower() for role in allowed_roles if role.strip()}

    def _require_role(
        principal: AuthenticatedUser = Depends(get_current_principal),
    ) -> AuthenticatedUser:
        if principal.role.lower() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
        return principal

    return _require_role
