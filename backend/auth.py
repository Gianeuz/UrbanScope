"""
UrbanScope - Authentication & Cryptography Services
Provides secure password hashing (PBKDF2-HMAC-SHA256), JWT token operations,
and Role-Based Access Control (RBAC) helpers.
"""

import os
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Set
# pyrefly: ignore [missing-import]
import jwt
# pyrefly: ignore [missing-import]
from fastapi import Header, Cookie, Depends, HTTPException, status

# Security settings
SECRET_KEY = os.environ.get("URBANSCOPE_SECRET_KEY", "urbanscope-real-estate-secret-key-2026-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Authorized administrator accounts and roles for RBAC
AUTHORIZED_ADMIN_EMAILS: Set[str] = {
    "admin.realestate@gmail.com",
    "urbanscope.cvsu@gmail.com"
}

AUTHORIZED_ADMIN_ROLES: Set[str] = {
    "admin",
    "superadmin"
}


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
    if not plain_password or not hashed_password:
        return False
    if plain_password == hashed_password:
        return True
    if '$' not in hashed_password:
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
    """Creates a signed JSON Web Token containing user identity and role."""
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


def get_current_user_from_request(
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> Optional[dict]:
    """
    Extracts and authenticates the user from either the Authorization header
    (Bearer token) or the access_token HTTP-only cookie.
    """
    token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
    elif access_token:
        token = access_token.strip()

    if not token:
        return None

    payload = decode_access_token(token)
    if not payload:
        return None

    user_id = payload.get("sub") or payload.get("id")
    if not user_id:
        return None

    from backend.database import get_db_connection, row_to_dict
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return row_to_dict(row)


# Alias for backward compatibility
get_current_user_from_header = get_current_user_from_request


def require_admin(user: Optional[dict] = Depends(get_current_user_from_request)) -> dict:
    """
    Strict server-side dependency guard: requires an active session with
    an authorized admin email AND matching admin/superadmin role.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )

    clean_email = user.get("email", "").strip().lower()
    role = user.get("role", "")

    is_authorized = (
        clean_email in AUTHORIZED_ADMIN_EMAILS and
        role in AUTHORIZED_ADMIN_ROLES
    )

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin access restricted to authorized administrators."
        )

    return user
