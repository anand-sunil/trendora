"""
Authentication service – registration, login, and profile retrieval.
"""

import logging

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.models.user import new_user_document
from app.schemas.auth_schema import RegisterRequest, UserOut
from app.utils.jwt_handler import create_access_token
from app.utils.password import hash_password, verify_password

logger = logging.getLogger(__name__)


def _user_to_out(user: dict) -> UserOut:
    """Map a raw MongoDB user document to a sanitised ``UserOut``."""
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user.get("role", "user"),
        created_at=user.get("created_at", ""),
    )


async def register_user(payload: RegisterRequest) -> dict:
    """
    Register a new user.

    Raises ``400`` if the email is already taken.
    Returns ``UserOut`` and a JWT token.
    """
    db = get_database()

    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed = hash_password(payload.password)
    doc = new_user_document(name=payload.name, email=payload.email, hashed_password=hashed)
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    user_out = _user_to_out(doc)
    token = create_access_token({"sub": str(result.inserted_id)})

    logger.info("New user registered: %s", payload.email)
    return {"access_token": token, "token_type": "bearer", "user": user_out.model_dump()}


async def login_user(email: str, password: str) -> dict:
    """
    Authenticate user credentials and return a JWT.

    Raises ``401`` on bad credentials.
    """
    db = get_database()
    user = await db.users.find_one({"email": email})

    if user is None or not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_out = _user_to_out(user)
    token = create_access_token({"sub": str(user["_id"])})

    logger.info("User logged in: %s", email)
    return {"access_token": token, "token_type": "bearer", "user": user_out.model_dump()}


async def get_user_profile(user_id: str) -> UserOut:
    """Fetch a user profile by ID."""
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return _user_to_out(user)
