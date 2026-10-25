"""
UrbanScope Real Estate - FastAPI Backend Application
Serves REST API endpoints, SQLite persistence, RBAC route protection,
and static website hosting.
"""

import os
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status, Query, Depends, Header, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, HTMLResponse

from backend.database import get_db_connection, init_db, row_to_dict, determine_user_role
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    get_current_user_from_request,
    get_current_user_from_header,
    require_admin,
    require_superadmin,
    AUTHORIZED_ADMIN_EMAILS,
    AUTHORIZED_ADMIN_ROLES,
    AUTHORIZED_SUPERADMIN_EMAILS
)
from backend.models import (
    UserRegister,
    UserLogin,
    UserResponse,
    AuthResponse,
    PropertyCreate,
    PropertyUpdate,
    PropertyResponse,
    InquiryCreate,
    InquiryResponse,
    UserRoleUpdate,
    SuperadminCreateUser
)


# Root directory of the repository
ROOT_DIR = Path(__file__).resolve().parent.parent

# Static website (index.html, pages/, shared/, assets/)
FRONTEND_DIR = ROOT_DIR / "frontend"

# Guarantee database tables, triggers, and RBAC seeds exist
init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager to initialize database and seeds on startup."""
    init_db()
    yield


app = FastAPI(
    title="UrbanScope Real Estate API",
    description="Python Backend for CD Miranda Realty & Miriam Lobren Real Estate Platform with RBAC",
    version="1.0.0",
    lifespan=lifespan
)

# Enable Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# STRICT SERVER-SIDE ROUTE GUARD (RBAC MIDDLEWARE)
# ==========================================================

FORBIDDEN_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 Forbidden - Access Restricted</title>
    <style>
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            background: #fdfefe;
            color: #1b2e21;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .error-box {
            max-width: 500px;
            width: 100%;
            background: #ffffff;
            border: 1.5px solid #e2b3b0;
            border-radius: 16px;
            padding: 40px 32px;
            text-align: center;
            box-shadow: 0 14px 36px rgba(179, 56, 44, 0.09);
        }
        .badge {
            display: inline-block;
            padding: 6px 14px;
            background: #fdeeec;
            color: #b3382c;
            font-size: 0.8rem;
            font-weight: 700;
            border-radius: 999px;
            margin-bottom: 18px;
            letter-spacing: 0.8px;
        }
        h1 {
            font-size: 1.85rem;
            color: #b3382c;
            margin: 0 0 12px;
            font-weight: 800;
        }
        p {
            font-size: 0.95rem;
            color: #5f7364;
            line-height: 1.6;
            margin: 0 0 28px;
        }
        .btn-home {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 26px;
            background: #2d5c39;
            color: #ffffff;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.92rem;
            transition: background 0.2s;
        }
        .btn-home:hover {
            background: #1a3b23;
        }
    </style>
</head>
<body>
    <div class="error-box">
        <span class="badge">403 FORBIDDEN</span>
        <h1>Access Restricted</h1>
        <p>Your account does not have administrator privileges to view this portal. Access is strictly limited to authorized administrators (<code>admin.realestate@gmail.com</code> and <code>urbanscope.cvsu@gmail.com</code>).</p>
        <a href="/" class="btn-home">Return to Home Page</a>
    </div>
</body>
</html>"""

FORBIDDEN_SUPERADMIN_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 Forbidden - Superadmin Clearance Required</title>
    <style>
        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            background: #0f1610;
            color: #e8eee9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .error-box {
            max-width: 520px;
            width: 100%;
            background: #172219;
            border: 1.5px solid #2d4530;
            border-radius: 16px;
            padding: 42px 34px;
            text-align: center;
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45);
        }
        .badge {
            display: inline-block;
            padding: 6px 16px;
            background: rgba(201, 162, 74, 0.15);
            color: #e5c068;
            font-size: 0.8rem;
            font-weight: 700;
            border: 1px solid rgba(201, 162, 74, 0.35);
            border-radius: 999px;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }
        h1 {
            font-size: 1.85rem;
            color: #ffffff;
            margin: 0 0 12px;
            font-weight: 800;
        }
        p {
            font-size: 0.95rem;
            color: #9cb1a2;
            line-height: 1.6;
            margin: 0 0 28px;
        }
        .btn-group {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn-admin {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            background: #c9a24a;
            color: #0d140e;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.92rem;
            transition: background 0.2s;
        }
        .btn-admin:hover {
            background: #dfb960;
        }
        .btn-home {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 24px;
            background: #253928;
            color: #ffffff;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.92rem;
            transition: background 0.2s;
        }
        .btn-home:hover {
            background: #2e4732;
        }
    </style>
</head>
<body>
    <div class="error-box">
        <span class="badge">403 SUPERADMIN CLEARANCE REQUIRED</span>
        <h1>Executive Access Restricted</h1>
        <p>Access to the UrbanScope Superadmin Console is strictly restricted to the primary superadministrator (<code>urbanscope.cvsu@gmail.com</code>). Regular administrator and client accounts are forbidden from accessing this console.</p>
        <div class="btn-group">
            <a href="/pages/admin/dashboard.html" class="btn-admin">Go to Admin Portal</a>
            <a href="/" class="btn-home">Return to Home</a>
        </div>
    </div>
</body>
</html>"""


@app.middleware("http")
async def rbac_admin_guard_middleware(request: Request, call_next):
    """
    Strict server-side route guard:
    - Superadmin portal (/superadmin, /pages/superadmin/*): ONLY urbanscope.cvsu@gmail.com with role == 'superadmin'.
    - Admin portal (/admin, /pages/admin/*): ONLY authorized admins/superadmins (admin.realestate@gmail.com / urbanscope.cvsu@gmail.com).
    """
    path = request.url.path

    # Check if request targets superadmin portal page
    is_superadmin_path = (
        path == "/superadmin" or
        path.startswith("/superadmin/") or
        path == "/pages/superadmin" or
        path.startswith("/pages/superadmin/")
    )

    # Check if request targets an admin portal page
    is_admin_path = (
        path == "/admin" or
        path.startswith("/admin/") or
        path == "/pages/admin" or
        path.startswith("/pages/admin/")
    )

    if is_superadmin_path or is_admin_path:
        file_name = path.split("/")[-1].lower()

        # Public files in portal directories (legacy login URL and static assets)
        is_public_portal_file = (
            file_name == "login.html" or
            file_name.endswith(".js") or
            file_name.endswith(".css") or
            file_name.endswith(".js.map") or
            file_name.endswith(".png") or
            file_name.endswith(".jpg") or
            file_name.endswith(".jpeg") or
            file_name.endswith(".svg") or
            file_name.endswith(".ico") or
            file_name.endswith(".webp")
        )

        if not is_public_portal_file:
            # Extract token from authorization header or cookie
            token = None
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.lower().startswith("bearer "):
                token = auth_header.split(" ", 1)[1].strip()
            elif "access_token" in request.cookies:
                token = request.cookies.get("access_token")

            # 1. Unauthenticated visitors: redirect to the shared login page
            if not token:
                login_redirect = f"/pages/auth/login.html?redirect={request.url.path.lstrip('/')}"
                return RedirectResponse(url=login_redirect, status_code=status.HTTP_302_FOUND)

            payload = decode_access_token(token)
            if not payload:
                login_redirect = "/pages/auth/login.html?reason=expired"
                return RedirectResponse(url=login_redirect, status_code=status.HTTP_302_FOUND)

            user_id = payload.get("sub") or payload.get("id")
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, role FROM users WHERE id = ?", (user_id,))
            user_row = cursor.fetchone()
            conn.close()

            if not user_row:
                return RedirectResponse(url="/pages/auth/login.html", status_code=status.HTTP_302_FOUND)

            user_email = user_row["email"].lower().strip()
            user_role = user_row["role"]

            # 2. Strict Role Checks:
            if is_superadmin_path:
                # ONLY urbanscope.cvsu@gmail.com with role == 'superadmin'
                is_authorized_superadmin = (
                    user_email in AUTHORIZED_SUPERADMIN_EMAILS and
                    user_role == "superadmin"
                )
                if not is_authorized_superadmin:
                    return HTMLResponse(content=FORBIDDEN_SUPERADMIN_HTML, status_code=status.HTTP_403_FORBIDDEN)

            elif is_admin_path:
                # Authorized admin or superadmin
                is_authorized_admin = (
                    user_email in AUTHORIZED_ADMIN_EMAILS and
                    user_role in AUTHORIZED_ADMIN_ROLES
                )
                if not is_authorized_admin:
                    return HTMLResponse(content=FORBIDDEN_HTML, status_code=status.HTTP_403_FORBIDDEN)

    response = await call_next(request)
    return response


# ==========================================================
# HEALTH & STATS ENDPOINTS
# ==========================================================

@app.get("/api/health", tags=["System"])
def health_check():
    """System health check and backend status."""
    return {"status": "ok", "service": "UrbanScope Python Backend", "version": "1.0.0"}


@app.get("/api/stats", tags=["Dashboard"])
def get_dashboard_stats(admin_user: dict = Depends(require_admin)):
    """Aggregated stats for the admin analytics dashboard (strictly admin only)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM properties")
    total_properties = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inquiries")
    total_inquiries = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inquiries WHERE LOWER(status) LIKE '%review%' OR LOWER(status) LIKE '%pending%'")
    pending_inquiries = cursor.fetchone()[0]

    conn.close()

    return {
        "total_properties": total_properties,
        "total_inquiries": total_inquiries,
        "pending_inquiries": pending_inquiries
    }


# ==========================================================
# AUTHENTICATION ENDPOINTS (WITH RBAC)
# ==========================================================

@app.post("/api/auth/register", response_model=AuthResponse, tags=["Auth"])
def register_user(payload: UserRegister, response: Response):
    """
    Registers a new user account with automatic database role detection:
    - admin.realestate@gmail.com -> 'admin'
    - urbanscope.cvsu@gmail.com -> 'superadmin'
    - all other emails -> 'user'
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    clean_email = payload.email.strip().lower()

    # Check for existing email
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Automatic role assignment (also strictly enforced by SQLite trigger)
    role = determine_user_role(clean_email)
    pwd_hash = hash_password(payload.password)

    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, phone, role)
        VALUES (?, ?, ?, ?, ?)
    """, (clean_email, pwd_hash, payload.full_name.strip(), payload.phone.strip() if payload.phone else "", role))
    conn.commit()

    user_id = cursor.lastrowid
    cursor.execute("SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?", (user_id,))
    user_dict = row_to_dict(cursor.fetchone())
    conn.close()

    # Issue JWT containing user id, email, and role
    token = create_access_token({
        "sub": str(user_dict["id"]),
        "id": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"]
    })

    # Set secure cookie for browser route protection
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/"
    )

    # Automatic login redirection based on identity and role
    if user_dict["role"] == "superadmin" and clean_email in AUTHORIZED_SUPERADMIN_EMAILS:
        redirect_url = "/pages/superadmin/dashboard.html"
    elif user_dict["role"] in AUTHORIZED_ADMIN_ROLES and clean_email in AUTHORIZED_ADMIN_EMAILS:
        redirect_url = "/pages/admin/dashboard.html"
    else:
        redirect_url = "/index.html"

    return AuthResponse(
        success=True,
        token=token,
        user=UserResponse(**user_dict),
        redirect_url=redirect_url,
        message="Registration successful"
    )


@app.post("/api/auth/login", response_model=AuthResponse, tags=["Auth"])
def login_user(payload: UserLogin, response: Response):
    """
    Authenticates a user against verified database credentials and issues
    token with automatic redirection based on role:
    - Superadmin (urbanscope.cvsu@gmail.com) -> /pages/superadmin/dashboard.html
    - Authorized admins (admin.realestate@gmail.com) -> /pages/admin/dashboard.html
    - Normal users -> /index.html (User dashboard)
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    clean_email = payload.email.strip().lower()

    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean_email,))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row or not verify_password(payload.password, user_row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_dict = row_to_dict(user_row)
    user_email = user_dict["email"].lower().strip()
    user_role = user_dict["role"]

    # Store user identity and role in token
    token = create_access_token({
        "sub": str(user_dict["id"]),
        "id": user_dict["id"],
        "email": user_dict["email"],
        "role": user_dict["role"]
    })

    # Set cookie for server-side page navigation guards
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/"
    )

    # Automatic redirection logic:
    # - urbanscope.cvsu@gmail.com (superadmin) -> Superadmin Dashboard
    # - admin.realestate@gmail.com (admin) -> Admin Dashboard
    # - Otherwise -> Normal user dashboard
    if user_role == "superadmin" and user_email in AUTHORIZED_SUPERADMIN_EMAILS:
        redirect_url = "/pages/superadmin/dashboard.html"
    elif user_role in AUTHORIZED_ADMIN_ROLES and user_email in AUTHORIZED_ADMIN_EMAILS:
        redirect_url = "/pages/admin/dashboard.html"
    else:
        redirect_url = "/index.html"

    return AuthResponse(
        success=True,
        token=token,
        user=UserResponse(**user_dict),
        redirect_url=redirect_url,
        message="Sign in successful"
    )


@app.post("/api/auth/logout", tags=["Auth"])
@app.get("/api/auth/logout", tags=["Auth"])
def logout_user(response: Response):
    """Sign out endpoint that invalidates the session cookie."""
    response.delete_cookie(key="access_token", path="/")
    return {"success": True, "message": "Sign out successful"}


@app.get("/api/auth/me", tags=["Auth"])
def get_current_user_profile(user: Optional[dict] = Depends(get_current_user_from_request)):
    """Returns the authenticated user's profile from token or cookie."""
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


# ==========================================================
# PROPERTIES ENDPOINTS
# ==========================================================

@app.get("/api/properties", response_model=List[PropertyResponse], tags=["Properties"])
def list_properties(
    type: Optional[str] = Query(None, description="Filter by property type (e.g. Townhouse, Subdivision)"),
    location: Optional[str] = Query(None, description="Filter by location keyword"),
    search: Optional[str] = Query(None, description="Search keyword in title or location")
):
    """Retrieves properties with optional filtering (Public catalog)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM properties WHERE 1=1"
    params = []

    type_val = type.strip() if isinstance(type, str) and type.strip() else None
    loc_val = location.strip() if isinstance(location, str) and location.strip() else None
    search_val = search.strip() if isinstance(search, str) and search.strip() else None

    # Filter by property type
    if type_val and type_val.lower() != "all":
        t_clean = type_val.lower()
        if t_clean in ["villa", "villas"]:
            query += " AND NORMALIZE(property_type) LIKE '%villa%'"
        elif t_clean in ["townhouse", "townhouses"]:
            query += " AND NORMALIZE(property_type) LIKE '%townhouse%'"
        elif t_clean in ["apartment", "apartments", "condo", "condominium", "condominiums"]:
            query += " AND (NORMALIZE(property_type) LIKE '%condominium%' OR NORMALIZE(property_type) LIKE '%apartment%')"
        elif t_clean in ["subdivision", "subdivisions"]:
            query += " AND NORMALIZE(property_type) LIKE '%subdivision%'"
        elif t_clean in ["triplex", "triplexes"]:
            query += " AND NORMALIZE(property_type) LIKE '%triplex%'"
        elif t_clean in ["single attached", "single-attached"]:
            query += " AND NORMALIZE(property_type) LIKE '%single attached%'"
        elif t_clean in ["luxury", "luxury villas"]:
            query += " AND (NORMALIZE(property_type) LIKE '%villa%' OR price >= 5000000)"
        elif t_clean in ["house-lot", "house & lot", "house", "houses"]:
            query += " AND (NORMALIZE(property_type) LIKE '%townhouse%' OR NORMALIZE(property_type) LIKE '%subdivision%' OR NORMALIZE(property_type) LIKE '%single attached%' OR NORMALIZE(property_type) LIKE '%triplex%' OR NORMALIZE(property_type) LIKE '%villa%')"
        else:
            query += " AND NORMALIZE(property_type) LIKE '%' || NORMALIZE(?) || '%'"
            params.append(type_val)

    # Filter by location
    if loc_val and loc_val.lower() != "all":
        query += " AND NORMALIZE(location) LIKE '%' || NORMALIZE(?) || '%'"
        params.append(loc_val)

    # Search keyword across title, location, type, description, amenities
    if search_val:
        query += " AND (NORMALIZE(title) LIKE '%' || NORMALIZE(?) || '%' OR NORMALIZE(location) LIKE '%' || NORMALIZE(?) || '%' OR NORMALIZE(property_type) LIKE '%' || NORMALIZE(?) || '%' OR NORMALIZE(description) LIKE '%' || NORMALIZE(?) || '%' OR NORMALIZE(amenities) LIKE '%' || NORMALIZE(?) || '%')"
        params.extend([search_val, search_val, search_val, search_val, search_val])

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    properties = [row_to_dict(r) for r in rows]
    conn.close()

    return properties


@app.get("/api/properties/{property_id}", response_model=PropertyResponse, tags=["Properties"])
def get_property(property_id: int):
    """Retrieves a single property by its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM properties WHERE id = ?", (property_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property listing not found")

    return row_to_dict(row)


@app.post("/api/properties", response_model=PropertyResponse, tags=["Properties"])
def create_property(payload: PropertyCreate, admin_user: dict = Depends(require_admin)):
    """Creates a new property listing (strictly admin only)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO properties (
            title, location, property_type, price,
            bedrooms, bathrooms, lot_area, floor_area, carports, storeys,
            status, image_url, description, amenities
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.title.strip(),
        payload.location.strip(),
        payload.property_type.strip(),
        payload.price,
        payload.bedrooms,
        payload.bathrooms,
        payload.lot_area,
        payload.floor_area,
        payload.carports,
        payload.storeys,
        payload.status,
        payload.image_url,
        payload.description,
        payload.amenities
    ))
    conn.commit()

    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM properties WHERE id = ?", (new_id,))
    new_prop = row_to_dict(cursor.fetchone())
    conn.close()

    return new_prop


@app.put("/api/properties/{property_id}", response_model=PropertyResponse, tags=["Properties"])
def update_property(property_id: int, payload: PropertyUpdate, admin_user: dict = Depends(require_admin)):
    """Updates an existing property listing (strictly admin only)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM properties WHERE id = ?", (property_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    updates = []
    params = []
    data = payload.model_dump(exclude_unset=True)

    for field, val in data.items():
        updates.append(f"{field} = ?")
        params.append(val)

    if updates:
        params.append(property_id)
        cursor.execute(f"UPDATE properties SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    cursor.execute("SELECT * FROM properties WHERE id = ?", (property_id,))
    updated = row_to_dict(cursor.fetchone())
    conn.close()

    return updated


@app.delete("/api/properties/{property_id}", tags=["Properties"])
def delete_property(property_id: int, admin_user: dict = Depends(require_admin)):
    """Deletes a property listing by ID (strictly admin only)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM properties WHERE id = ?", (property_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    cursor.execute("DELETE FROM properties WHERE id = ?", (property_id,))
    conn.commit()
    conn.close()

    return {"success": True, "message": f"Property #{property_id} successfully deleted"}


# ==========================================================
# INQUIRY ENDPOINTS
# ==========================================================

@app.post("/api/inquiries", tags=["Inquiries"])
def submit_inquiry(payload: InquiryCreate):
    """Submits a new client inquiry (Public / Client)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO inquiries (property_title, client_name, client_email, client_phone, message, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        payload.property_title or "General Inquiry",
        payload.client_name.strip(),
        payload.client_email.strip(),
        payload.client_phone.strip() if payload.client_phone else "",
        payload.message.strip(),
        payload.status or "Under Review"
    ))
    conn.commit()

    inq_id = cursor.lastrowid
    cursor.execute("SELECT * FROM inquiries WHERE id = ?", (inq_id,))
    new_inq = row_to_dict(cursor.fetchone())
    conn.close()

    return {"success": True, "data": new_inq}


@app.get("/api/inquiries", response_model=List[InquiryResponse], tags=["Inquiries"])
def list_inquiries(admin_user: dict = Depends(require_admin)):
    """Lists all submitted inquiries (strictly admin only)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inquiries ORDER BY created_at DESC")
    rows = cursor.fetchall()
    inquiries = [row_to_dict(r) for r in rows]
    conn.close()

    return inquiries


@app.patch("/api/inquiries/{inquiry_id}", tags=["Inquiries"])
def update_inquiry_status(inquiry_id: int, payload: dict, admin_user: dict = Depends(require_admin)):
    """Updates status of an inquiry (admin only)."""
    status = payload.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE inquiries SET status = ? WHERE id = ?", (status, inquiry_id))
    conn.commit()
    conn.close()
    return {"success": True, "id": inquiry_id, "status": status}


# ==========================================================
# SUPERADMIN EXECUTIVE ENDPOINTS
# ==========================================================

@app.get("/api/superadmin/overview", tags=["Superadmin"])
def get_superadmin_overview(current_superadmin: dict = Depends(require_superadmin)):
    """Executive overview with master counts, database metrics, and system status."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # User counts by role
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'superadmin'")
    superadmin_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
    admin_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
    normal_users_count = cursor.fetchone()[0]

    # Properties stats
    cursor.execute("SELECT COUNT(*) FROM properties")
    total_properties = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM properties WHERE LOWER(status) = 'available'")
    available_properties = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM properties WHERE LOWER(status) = 'sold'")
    sold_properties = cursor.fetchone()[0]

    # Inquiries stats
    cursor.execute("SELECT COUNT(*) FROM inquiries")
    total_inquiries = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inquiries WHERE LOWER(status) LIKE '%review%' OR LOWER(status) LIKE '%pending%'")
    pending_inquiries = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inquiries WHERE LOWER(status) LIKE '%approved%'")
    approved_inquiries = cursor.fetchone()[0]

    # Database file stats
    db_path = ROOT_DIR / "backend" / "urbanscope.db"
    db_size_kb = round(db_path.stat().st_size / 1024, 2) if db_path.exists() else 0.0

    # Trigger health check
    cursor.execute("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN ('trg_user_role_insert', 'set_user_role_on_insert')")
    trigger_exists = bool(cursor.fetchone())

    conn.close()

    return {
        "status": "operational",
        "superadmin_email": current_superadmin.get("email"),
        "metrics": {
            "total_users": total_users,
            "superadmins": superadmin_count,
            "admins": admin_count,
            "regular_users": normal_users_count,
            "total_properties": total_properties,
            "available_properties": available_properties,
            "sold_properties": sold_properties,
            "total_inquiries": total_inquiries,
            "pending_inquiries": pending_inquiries,
            "approved_inquiries": approved_inquiries,
            "db_size_kb": db_size_kb,
            "trigger_active": trigger_exists
        }
    }


@app.get("/api/users", tags=["Users"])
def get_user_directory(current_user: dict = Depends(require_admin)):
    """Retrieves all registered user accounts for the admin user directory."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, phone, role, created_at FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@app.get("/api/superadmin/users", tags=["Superadmin"])
def list_superadmin_users(current_superadmin: dict = Depends(require_superadmin)):
    """Retrieves all registered user accounts with role classifications."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, full_name, phone, role, created_at FROM users ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@app.put("/api/superadmin/users/{user_id}/role", tags=["Superadmin"])
def update_user_role(user_id: int, payload: UserRoleUpdate, current_superadmin: dict = Depends(require_superadmin)):
    """Updates the role of a user account. Root superadmin account is protected."""
    target_role = payload.role.strip().lower()
    if target_role not in ("user", "admin", "superadmin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'user', 'admin', or 'superadmin'.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, role FROM users WHERE id = ?", (user_id,))
    target_user = cursor.fetchone()
    if not target_user:
        conn.close()
        raise HTTPException(status_code=404, detail="User account not found.")

    target_email = target_user["email"].lower().strip()

    # Protection: Root superadmin cannot be demoted
    if target_email == "urbanscope.cvsu@gmail.com" and target_role != "superadmin":
        conn.close()
        raise HTTPException(status_code=400, detail="The root Superadmin account (urbanscope.cvsu@gmail.com) cannot be demoted.")

    cursor.execute("UPDATE users SET role = ? WHERE id = ?", (target_role, user_id))
    conn.commit()

    cursor.execute("SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?", (user_id,))
    updated_user = row_to_dict(cursor.fetchone())
    conn.close()

    return {"success": True, "message": f"Role updated to '{target_role}'", "user": updated_user}


@app.post("/api/superadmin/users", tags=["Superadmin"])
def superadmin_create_user(payload: SuperadminCreateUser, current_superadmin: dict = Depends(require_superadmin)):
    """Creates a new user or admin account directly from Superadmin console."""
    clean_email = payload.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (clean_email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email is already registered.")

    assigned_role = payload.role.strip().lower()
    if assigned_role not in ("user", "admin", "superadmin"):
        assigned_role = "user"

    password_hash = hash_password(payload.password)
    cursor.execute(
        "INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?)",
        (clean_email, password_hash, payload.full_name.strip(), payload.phone.strip(), assigned_role)
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.execute("SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?", (new_id,))
    new_user = row_to_dict(cursor.fetchone())
    conn.close()

    return {"success": True, "message": "Account created successfully.", "user": new_user}


@app.delete("/api/superadmin/users/{user_id}", tags=["Superadmin"])
def delete_user_account(user_id: int, current_superadmin: dict = Depends(require_superadmin)):
    """Deletes a user account. Root superadmin and primary admin accounts are protected."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, role FROM users WHERE id = ?", (user_id,))
    target_user = cursor.fetchone()
    if not target_user:
        conn.close()
        raise HTTPException(status_code=404, detail="User account not found.")

    target_email = target_user["email"].lower().strip()

    if target_email == "urbanscope.cvsu@gmail.com":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete root Superadmin account.")

    if target_email == "admin.realestate@gmail.com":
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot delete primary Realty Admin account.")

    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return {"success": True, "message": f"User account {target_email} deleted successfully."}


@app.get("/api/superadmin/integrity", tags=["Superadmin"])
def run_integrity_check(current_superadmin: dict = Depends(require_superadmin)):
    """Runs SQLite integrity and foreign-key checks and verifies the role trigger."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("PRAGMA integrity_check")
    integrity_rows = [row[0] for row in cursor.fetchall()]
    integrity_ok = integrity_rows == ["ok"]

    cursor.execute("PRAGMA foreign_key_check")
    fk_violations = len(cursor.fetchall())

    cursor.execute("SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN ('trg_user_role_insert', 'set_user_role_on_insert')")
    trigger_active = bool(cursor.fetchone())

    cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    table_count = cursor.fetchone()[0]

    conn.close()

    return {
        "success": integrity_ok and fk_violations == 0,
        "integrity": "ok" if integrity_ok else "; ".join(integrity_rows[:5]),
        "foreign_key_violations": fk_violations,
        "trigger_active": trigger_active,
        "table_count": table_count
    }


# ==========================================================
# STATIC FILES & WEB HOSTING
# ==========================================================

# Direct shortcut routes for superadmin, admin, and user dashboards
@app.get("/superadmin", include_in_schema=False)
@app.get("/superadmin/", include_in_schema=False)
def redirect_superadmin():
    """Shortcut redirect to the superadmin dashboard."""
    return RedirectResponse(url="/pages/superadmin/dashboard.html", status_code=status.HTTP_302_FOUND)


@app.get("/admin", include_in_schema=False)
@app.get("/admin/", include_in_schema=False)
@app.get("/admin_dashboard", include_in_schema=False)
def redirect_admin():
    """Shortcut redirect to the admin dashboard."""
    return RedirectResponse(url="/pages/admin/dashboard.html", status_code=status.HTTP_302_FOUND)


@app.get("/dashboard", include_in_schema=False)
@app.get("/user_dashboard", include_in_schema=False)
def redirect_user_dashboard():
    """Shortcut redirect to normal user page."""
    return RedirectResponse(url="/index.html", status_code=status.HTTP_302_FOUND)



@app.get("/pages/admin/properties.html", include_in_schema=False)
@app.get("/pages/admin/manage-properties.html", include_in_schema=False)
def redirect_admin_properties_html():
    """Redirects legacy or alias admin properties link to propertylist.html."""
    return RedirectResponse(url="/pages/admin/propertylist.html", status_code=status.HTTP_302_FOUND)


@app.get("/pages/admin/login.html", include_in_schema=False)
def redirect_admin_login_html(request: Request):
    """The separate admin login page was removed; everyone signs in on the shared login page."""
    target = "/pages/auth/login.html"
    if request.url.query:
        target += f"?{request.url.query}"
    return RedirectResponse(url=target, status_code=status.HTTP_302_FOUND)


# Mount directories for modular pages and assets
for folder in ["pages", "shared", "assets"]:
    dir_path = FRONTEND_DIR / folder
    if dir_path.is_dir():
        app.mount(f"/{folder}", StaticFiles(directory=str(dir_path), html=True), name=folder)


# Pre-reorganization URLs (e.g. /properties/properties.html) now live under /pages/.
# Redirect them so old bookmarks and shared links keep working.
def _make_legacy_redirect(section: str):
    def redirect_legacy(path: str, request: Request):
        target = f"/pages/{section}/{path}"
        if request.url.query:
            target += f"?{request.url.query}"
        return RedirectResponse(url=target, status_code=status.HTTP_301_MOVED_PERMANENTLY)
    return redirect_legacy


for section in ["properties", "inquiry", "auth", "admin"]:
    app.add_api_route(
        f"/{section}/{{path:path}}",
        _make_legacy_redirect(section),
        methods=["GET"],
        include_in_schema=False,
    )


@app.get("/", include_in_schema=False)
def serve_home():
    """Serves root landing page index.html."""
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.get("/index.html", include_in_schema=False)
def serve_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.get("/index.css", include_in_schema=False)
def serve_index_css():
    return FileResponse(str(FRONTEND_DIR / "index.css"), media_type="text/css")


@app.get("/index.js", include_in_schema=False)
def serve_index_js():
    return FileResponse(str(FRONTEND_DIR / "index.js"), media_type="application/javascript")


@app.get("/favicon.ico", include_in_schema=False)
def serve_favicon():
    fav = FRONTEND_DIR / "assets" / "images" / "favicon.jpg"
    if fav.exists():
        return FileResponse(str(fav))
    return JSONResponse(status_code=404, content={"detail": "Not found"})
