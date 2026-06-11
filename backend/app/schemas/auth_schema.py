"""
Pydantic V2 schemas for authentication requests / responses.
"""

from pydantic import BaseModel, EmailStr, Field


# ── Request schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """Body for POST /api/auth/register."""

    name: str = Field(..., min_length=2, max_length=100, examples=["Anand Kumar"])
    email: EmailStr = Field(..., examples=["anand@example.com"])
    password: str = Field(..., min_length=6, max_length=128, examples=["Str0ng!Pass"])

    model_config = {"json_schema_extra": {"examples": [{"name": "Anand Kumar", "email": "anand@example.com", "password": "Str0ng!Pass"}]}}


class LoginRequest(BaseModel):
    """Body for POST /api/auth/login."""

    email: EmailStr = Field(..., examples=["anand@example.com"])
    password: str = Field(..., examples=["Str0ng!Pass"])


# ── Response schemas ─────────────────────────────────────────────────────────

class UserOut(BaseModel):
    """Sanitised user representation (no password)."""

    id: str = Field(..., examples=["665e..."])
    name: str
    email: str
    role: str = "user"
    created_at: str


class TokenResponse(BaseModel):
    """JWT token wrapper returned on login."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MeResponse(BaseModel):
    """Response for GET /api/auth/me."""

    user: UserOut
