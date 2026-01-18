from __future__ import annotations

import hashlib
import os
import secrets
from typing import Optional

from fastapi import Header, HTTPException, status


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_admin_token() -> str:
    return os.environ.get("OWP_ADMIN_TOKEN", "dev-admin")


def require_admin(x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")) -> None:
    if x_admin_token != get_admin_token():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")


def require_bearer_token(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expected Bearer token")
    return authorization.split(" ", 1)[1].strip()
