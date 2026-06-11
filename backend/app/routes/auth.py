"""
Authentication routes – register, login, and current-user profile.
"""

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_current_user
from app.schemas.auth_schema import (
    LoginRequest,
    MeResponse,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.services.auth_service import login_user, register_user
from app.utils.response import success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=None,
    summary="Register a new user",
    responses={
        201: {"description": "User registered successfully"},
        400: {"description": "Email already registered or validation error"},
    },
)
async def register(payload: RegisterRequest) -> dict:
    """
    Create a new user account.

    - Validates email format
    - Hashes password with bcrypt
    - Prevents duplicate emails
    - Returns JWT token + user data
    """
    data = await register_user(payload)
    return success_response(data=data, message="User registered successfully", status_code=201)


@router.post(
    "/login",
    response_model=None,
    summary="Login and obtain JWT token",
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid credentials"},
    },
)
async def login(payload: LoginRequest) -> dict:
    """Authenticate with email and password, receive a JWT."""
    data = await login_user(payload.email, payload.password)
    return success_response(data=data, message="Login successful")


@router.get(
    "/me",
    response_model=None,
    summary="Get current user profile",
    responses={
        200: {"description": "User profile retrieved"},
        401: {"description": "Not authenticated"},
    },
)
async def me(current_user: dict = Depends(get_current_user)) -> dict:
    """Return the profile of the currently authenticated user."""
    user_out = UserOut(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user.get("role", "user"),
        created_at=current_user.get("created_at", ""),
    )
    return success_response(data={"user": user_out.model_dump()})
