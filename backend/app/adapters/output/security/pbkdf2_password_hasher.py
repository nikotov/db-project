"""PBKDF2 password hasher adapter."""
import base64
import hashlib
import hmac
import os

from app.ports.output.password_hasher_port import PasswordHasherPort


class PBKDF2PasswordHasher(PasswordHasherPort):
    """Hashes and verifies passwords using PBKDF2-HMAC-SHA256."""

    def __init__(self, iterations: int = 200_000) -> None:
        self._iterations = iterations

    def hash_password(self, password: str) -> str:
        salt = os.urandom(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, self._iterations)
        payload = base64.b64encode(salt + digest).decode("ascii")
        return f"pbkdf2_sha256${self._iterations}${payload}"

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            algorithm, iter_s, payload = hashed_password.split("$", 2)
            if algorithm != "pbkdf2_sha256":
                return False
            iterations = int(iter_s)
            decoded = base64.b64decode(payload.encode("ascii"))
            salt, digest = decoded[:16], decoded[16:]
            candidate = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt,
                iterations,
            )
            return hmac.compare_digest(candidate, digest)
        except (ValueError, TypeError):
            return False
