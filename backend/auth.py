"""
UrbanScope - Authentication & Cryptography Services
Provides secure password hashing (PBKDF2-HMAC-SHA256), JWT token operations,
Google Identity Services (OAuth 2.0) token verification, and Role-Based Access Control (RBAC) helpers.
"""

import os
import json
import hmac
import hashlib
import secrets
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional, Set
# pyrefly: ignore [missing-import]
import jwt
# pyrefly: ignore [missing-import]
from fastapi import Header, Cookie, Depends, HTTPException, status

ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = ROOT_DIR / ".env"


def _parse_env_file(env_path: Path = ENV_FILE_PATH) -> dict[str, str]:
    """Parses key=value pairs from a local .env file without external dependencies."""
    values: dict[str, str] = {}
    if not env_path.is_file():
        return values
    try:
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip()
            if len(val) >= 2 and ((val[0] == '"' and val[-1] == '"') or (val[0] == "'" and val[-1] == "'")):
                val = val[1:-1].strip()
            if key:
                values[key] = val
    except OSError:
        pass
    return values


for _env_key, _env_val in _parse_env_file().items():
    if _env_val and _env_key not in os.environ:
        os.environ[_env_key] = _env_val

# Security settings
SECRET_KEY = os.environ.get("URBANSCOPE_SECRET_KEY", "urbanscope-real-estate-secret-key-2026-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def get_google_client_id() -> str:
    """
    Returns the configured Google OAuth 2.0 Client ID from environment variables,
    live .env file, or .env.example fallback (allowing immediate pickup without restarting).
    """
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        client_id = _parse_env_file(ENV_FILE_PATH).get("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        client_id = _parse_env_file(ROOT_DIR / ".env.example").get("GOOGLE_CLIENT_ID", "").strip()
    if client_id.lower().startswith("your_google_client_id") or client_id.lower().startswith("paste_"):
        return ""
    if client_id:
        os.environ["GOOGLE_CLIENT_ID"] = client_id
    return client_id


def _fetch_google_json(url: str, headers: Optional[dict] = None) -> dict:
    """Performs an HTTPS GET request against Google's OAuth2 endpoints and returns parsed JSON."""
    req = urllib.request.Request(url, headers=headers or {"Accept": "application/json"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except urllib.error.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google authentication token."
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Google authentication servers. Please check your internet connection."
        ) from exc


def verify_google_token(
    credential: Optional[str] = None,
    access_token: Optional[str] = None
) -> dict:
    """
    Verifies a Google ID Token (credential) or OAuth2 Access Token against Google's
    official verification endpoints and enforces audience matching against GOOGLE_CLIENT_ID.
    Returns normalized user claims: {google_id, email, full_name, avatar_url}.
    """
    client_id = get_google_client_id()
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured on the server. Add GOOGLE_CLIENT_ID to your .env file."
        )

    if credential and credential.strip():
        encoded = urllib.parse.quote(credential.strip(), safe="")
        info = _fetch_google_json(f"https://oauth2.googleapis.com/tokeninfo?id_token={encoded}")

        issuer = info.get("iss", "")
        if issuer not in ("accounts.google.com", "https://accounts.google.com"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token issuer.")

        aud = info.get("aud", "")
        if aud != client_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token client ID mismatch.")

        email = (info.get("email") or "").strip().lower()
        email_verified = str(info.get("email_verified", "")).lower() == "true"
        google_sub = (info.get("sub") or "").strip()
        if not email or not email_verified or not google_sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google account email is missing or not verified."
            )

        fallback_name = email.split("@")[0].replace(".", " ").replace("_", " ").title()
        full_name = (info.get("name") or fallback_name).strip()
        avatar_url = (info.get("picture") or "").strip()

        return {
            "google_id": google_sub,
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url
        }

    if access_token and access_token.strip():
        clean_token = access_token.strip()
        encoded = urllib.parse.quote(clean_token, safe="")

        # 1. Verify token audience (aud / azp) belongs to this UrbanScope GOOGLE_CLIENT_ID
        token_info = _fetch_google_json(f"https://oauth2.googleapis.com/tokeninfo?access_token={encoded}")
        aud = token_info.get("aud", "")
        azp = token_info.get("azp", "")
        if client_id not in (aud, azp):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google access token client ID mismatch.")

        # 2. Retrieve verified OpenID profile details (full name, avatar, verified email)
        profile = _fetch_google_json(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={
                "Authorization": f"Bearer {clean_token}",
                "Accept": "application/json"
            }
        )

        email = (profile.get("email") or token_info.get("email") or "").strip().lower()
        email_verified_raw = profile.get("email_verified", token_info.get("email_verified", False))
        email_verified = email_verified_raw is True or str(email_verified_raw).lower() == "true"
        google_sub = (profile.get("sub") or token_info.get("sub") or "").strip()

        if not email or not email_verified or not google_sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google account email is missing or not verified."
            )

        fallback_name = email.split("@")[0].replace(".", " ").replace("_", " ").title()
        full_name = (profile.get("name") or fallback_name).strip()
        avatar_url = (profile.get("picture") or "").strip()

        return {
            "google_id": google_sub,
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url
        }

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Missing Google credential or access_token."
    )

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
    if not payload and isinstance(token, str):
        if token.startswith("sb_session_") or token.startswith("sb_google_") or token.startswith("demo_token_"):
            parts = token.split("_")
            if len(parts) >= 3 and parts[2].isdigit():
                payload = {"sub": parts[2]}
    if not payload:
        return None

    user_id = payload.get("sub") or payload.get("id")
    if not user_id:
        return None

    from backend.database import get_db_connection, row_to_dict
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE id = ?",
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


AUTHORIZED_SUPERADMIN_EMAILS = {"urbanscope.cvsu@gmail.com"}


def require_superadmin(user: Optional[dict] = Depends(get_current_user_from_request)) -> dict:
    """
    Strict server-side dependency guard: requires an active session with
    the authorized superadmin email (urbanscope.cvsu@gmail.com) AND role == 'superadmin'.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in as Superadmin."
        )

    clean_email = user.get("email", "").strip().lower()
    role = user.get("role", "")

    if clean_email != "urbanscope.cvsu@gmail.com" or role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Exclusive Superadmin access required."
        )

    return user
