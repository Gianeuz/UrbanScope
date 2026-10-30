"""
UrbanScope - Pydantic Request & Response Data Models
Validates incoming payloads and structures API responses.
"""

from typing import Optional, List
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field


# ==========================================================
# AUTH SCHEMAS
# ==========================================================

class UserRegister(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password (minimum 6 characters)")
    full_name: str = Field(..., description="Full legal or preferred name")
    phone: Optional[str] = Field(default="", description="Contact phone number")


class UserLogin(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")


class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = Field(default=None, description="Google OAuth2 ID token (JWT) from Google Identity Services")
    access_token: Optional[str] = Field(default=None, description="Google OAuth2 access token from GIS Token Client")


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = ""
    role: str = "user"
    avatar_url: Optional[str] = "assets/images/agent.jpg"
    license_number: Optional[str] = ""
    title: Optional[str] = "Licensed Real Estate Broker / Agent"
    brokerage: Optional[str] = "CD Miranda Realty"
    bio: Optional[str] = ""
    google_id: Optional[str] = None
    created_at: Optional[str] = None


class AdminProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    title: Optional[str] = None
    brokerage: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current account password")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


class AuthResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[UserResponse] = None
    redirect_url: Optional[str] = None
    message: Optional[str] = None


# ==========================================================
# PROPERTY SCHEMAS
# ==========================================================

class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=2, description="Listing title")
    location: str = Field(..., min_length=2, description="Property city and location")
    property_type: str = Field(..., description="Type of property, e.g. Townhouse, Subdivision, Condominium, Single Attached")
    price: float = Field(..., gt=0, description="Selling price in Philippine Pesos")
    bedrooms: Optional[int] = Field(default=3, ge=0, description="Number of bedrooms")
    bathrooms: Optional[int] = Field(default=2, ge=0, description="Number of bathrooms")
    lot_area: Optional[float] = Field(default=120.0, ge=0, description="Lot area in square meters")
    floor_area: Optional[float] = Field(default=80.0, ge=0, description="Floor area in square meters")
    carports: Optional[int] = Field(default=1, ge=0, description="Car parking slots / carport")
    storeys: Optional[int] = Field(default=2, ge=1, description="Number of storeys/floors")
    status: Optional[str] = Field(default="Available")
    image_url: Optional[str] = Field(default="assets/images/property1.jpg")
    description: Optional[str] = Field(default="")
    amenities: Optional[str] = Field(default="", description="Key features and amenities")


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    property_type: Optional[str] = None
    price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    lot_area: Optional[float] = None
    floor_area: Optional[float] = None
    carports: Optional[int] = None
    storeys: Optional[int] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    amenities: Optional[str] = None


class PropertyResponse(BaseModel):
    id: int
    title: str
    location: str
    property_type: str
    price: float
    bedrooms: Optional[int] = 3
    bathrooms: Optional[int] = 2
    lot_area: Optional[float] = 120.0
    floor_area: Optional[float] = 80.0
    carports: Optional[int] = 1
    storeys: Optional[int] = 2
    status: Optional[str] = "Available"
    image_url: Optional[str] = ""
    description: Optional[str] = ""
    amenities: Optional[str] = ""
    created_at: Optional[str] = None


# ==========================================================
# INQUIRY SCHEMAS
# ==========================================================

class InquiryCreate(BaseModel):
    client_name: str = Field(..., min_length=2)
    client_email: str = Field(..., min_length=3)
    client_phone: Optional[str] = Field(default="")
    property_title: Optional[str] = Field(default="General Inquiry")
    message: str = Field(..., min_length=1)
    status: Optional[str] = Field(default="Under Review")


class InquiryResponse(BaseModel):
    id: int
    client_name: str
    client_email: str
    client_phone: Optional[str] = ""
    property_title: Optional[str] = "General Inquiry"
    message: str
    status: str = "Under Review"
    created_at: Optional[str] = None


class InquiryUpdate(BaseModel):
    property_title: Optional[str] = None
    client_phone: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None


# ==========================================================
# SUPERADMIN SCHEMAS
# ==========================================================

class UserRoleUpdate(BaseModel):
    role: str = Field(..., description="Target role: 'user', 'admin', or 'superadmin'")


class SuperadminCreateUser(BaseModel):
    email: str = Field(..., description="New user email address")
    password: str = Field(..., min_length=6, description="Account password")
    full_name: str = Field(..., description="Full legal name")
    phone: Optional[str] = Field(default="", description="Contact phone number")
    role: Optional[str] = Field(default="user", description="Account role ('user', 'admin')")


class SuperadminUpdateUser(BaseModel):
    full_name: Optional[str] = Field(default=None, description="Full legal name")
    email: Optional[str] = Field(default=None, description="Email address")
    phone: Optional[str] = Field(default=None, description="Contact phone number")
    role: Optional[str] = Field(default=None, description="Target role: 'user', 'admin', or 'superadmin'")
    password: Optional[str] = Field(default=None, description="Optional new password (min. 6 characters if provided)")

