"""JWT token service adapter."""
from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import json

from app.config import settings
from app.ports.output.token_service import TokenServicePort


class JWTTokenService(TokenServicePort):
    """Creates signed JWT access tokens."""

    @staticmethod
    def _b64url_encode(value: bytes) -> str:
        return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")

    def create_access_token(
        self,
        subject: str,
        claims: dict | None = None,
        expires_delta: timedelta | None = None,
    ) -> str:
        now = datetime.now(timezone.utc)
        expire = now + (expires_delta or timedelta(minutes=settings.jwt_access_token_expire_minutes))

        header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
        payload: dict[str, object] = {
            "sub": subject,
            "iat": int(now.timestamp()),
            "exp": int(expire.timestamp()),
        }
        if claims:
            payload.update(claims)

        header_segment = self._b64url_encode(
            json.dumps(header, separators=(",", ":")).encode("utf-8")
        )
        payload_segment = self._b64url_encode(
            json.dumps(payload, separators=(",", ":")).encode("utf-8")
        )
        signing_input = f"{header_segment}.{payload_segment}".encode("ascii")

        signature = hmac.new(
            settings.jwt_secret_key.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        signature_segment = self._b64url_encode(signature)
        return f"{header_segment}.{payload_segment}.{signature_segment}"
