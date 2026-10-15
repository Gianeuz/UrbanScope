"""
UrbanScope Real Estate - FastAPI Backend Application
Serves REST API endpoints, SQLite persistence, and static website hosting.
"""

import os
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status, Query, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse

from backend.database import get_db_connection, init_db, row_to_dict
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_from_header
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
    InquiryResponse
)

# Root directory of the repository
ROOT_DIR = Path(__file__).resolve().parent.parent

# Static website (index.html, pages/, shared/, assets/)
FRONTEND_DIR = ROOT_DIR / "frontend"

# Guarantee database tables and seeds exist
init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager to initialize database and seeds on startup."""
    init_db()
    yield


app = FastAPI(
    title="UrbanScope Real Estate API",
    description="Python Backend for CD Miranda Realty & Miriam Lobren Real Estate Platform",
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
# HEALTH & STATS ENDPOINTS
# ==========================================================

@app.get("/api/health", tags=["System"])
def health_check():
    """System health check and backend status."""
    return {"status": "ok", "service": "UrbanScope Python Backend", "version": "1.0.0"}


@app.get("/api/stats", tags=["Dashboard"])
def get_dashboard_stats():
    """Aggregated stats for the admin analytics dashboard."""
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
# AUTHENTICATION ENDPOINTS
# ==========================================================

@app.post("/api/auth/register", response_model=AuthResponse, tags=["Auth"])
def register_user(payload: UserRegister):
    """Registers a new client user account."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check for existing email
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (payload.email.strip(),))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    pwd_hash = hash_password(payload.password)
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, phone, role)
        VALUES (?, ?, ?, ?, 'user')
    """, (payload.email.strip().lower(), pwd_hash, payload.full_name.strip(), payload.phone.strip()))
    conn.commit()

    user_id = cursor.lastrowid
    cursor.execute("SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = ?", (user_id,))
    user_dict = row_to_dict(cursor.fetchone())
    conn.close()

    token = create_access_token({"sub": str(user_id), "email": user_dict["email"], "role": user_dict["role"]})

    return AuthResponse(
        success=True,
        token=token,
        user=UserResponse(**user_dict),
        message="Registration successful"
    )


@app.post("/api/auth/login", response_model=AuthResponse, tags=["Auth"])
def login_user(payload: UserLogin):
    """Authenticates a client or admin user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (payload.email.strip(),))
    user_row = cursor.fetchone()
    conn.close()

    if not user_row or not verify_password(payload.password, user_row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_dict = row_to_dict(user_row)
    token = create_access_token({"sub": str(user_dict["id"]), "email": user_dict["email"], "role": user_dict["role"]})

    return AuthResponse(
        success=True,
        token=token,
        user=UserResponse(**user_dict),
        message="Sign in successful"
    )


@app.post("/api/auth/logout", tags=["Auth"])
def logout_user():
    """Sign out endpoint."""
    return {"success": True, "message": "Sign out successful"}


@app.get("/api/auth/me", tags=["Auth"])
def get_current_user_profile(user: Optional[dict] = Depends(get_current_user_from_header)):
    """Returns the authenticated user's profile."""
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
    """Retrieves properties with optional filtering."""
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
def create_property(payload: PropertyCreate):
    """Creates a new property listing."""
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
def update_property(property_id: int, payload: PropertyUpdate):
    """Updates an existing property listing."""
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
def delete_property(property_id: int):
    """Deletes a property listing by ID."""
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
    """Submits a new client inquiry."""
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
def list_inquiries():
    """Lists all submitted inquiries for the admin dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inquiries ORDER BY created_at DESC")
    rows = cursor.fetchall()
    inquiries = [row_to_dict(r) for r in rows]
    conn.close()

    return inquiries


# ==========================================================
# STATIC FILES & WEB HOSTING
# ==========================================================

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
