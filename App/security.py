from fastapi import Header, HTTPException
import bcrypt

import hmac
import hashlib
import base64
import json
import time

from .config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES


def get_password_hash(password: str) -> str:

    password_bytes = password.encode("utf-8")[:72]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = dict(data)
    payload["exp"] = int(time.time()) + expires_minutes * 60

    segments = [
        _b64url_encode(json.dumps(
            header, separators=(",", ":")).encode("utf-8")),
        _b64url_encode(json.dumps(
            payload, separators=(",", ":")).encode("utf-8")),
    ]

    signing_input = ".".join(segments).encode("ascii")
    signature = hmac.new(SECRET_KEY.encode("utf-8"),
                         signing_input, hashlib.sha256).digest()
    segments.append(_b64url_encode(signature))

    return ".".join(segments)


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def decode_access_token(token: str) -> dict:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError:
        raise ValueError("Malformed token")

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_signature = hmac.new(
        SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()

    if not hmac.compare_digest(expected_signature, _b64url_decode(signature_b64)):
        raise ValueError("Invalid token signature")

    payload = json.loads(_b64url_decode(payload_b64))

    if payload.get("exp") is not None and time.time() > payload["exp"]:
        raise ValueError("Token has expired")

    return payload


def get_current_user(authorization: str = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401, detail="Missing authentication token")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return {
        "user_id": payload.get("user_id"),
        "role": (payload.get("role") or "").lower(),
    }


def require_professor(current_user: dict) -> None:
    if current_user.get("role") != "professor":
        raise HTTPException(
            status_code=403, detail="Access restricted to professors")
