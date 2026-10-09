"""
UrbanScope - Authentication & Cryptography Services
Provides secure password hashing (PBKDF2-HMAC-SHA256) and JWT token operations.
"""

import os
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import HTTPException, status, Header

# Security settings
SECRET_KEY = os.environ.get("URBANSCOPE_SECRET_KEY", "urbanscope-real-estate-secret-key-2026-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    """Hashes a password with a cryptographically secure random salt using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored salt$hash representation."""
    if not hashed_password or '$' not in hashed_password:
        return False
    try:
        salt, expected_hex = hashed_password.split('$', 1)
        computed_key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return hmac.compare_digest(computed_key.hex(), expected_hex)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JSON Web Token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JSON Web Token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def get_current_user_from_header(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Optional dependency that extracts the authenticated user from the Authorization header."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            from backend.database import get_db_connection, row_to_dict
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?", (payload["sub"],))
            user = row_to_dict(cursor.fetchone())
            conn.close()
            return user
    return None
