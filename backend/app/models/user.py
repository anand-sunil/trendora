"""
User document helpers and MongoDB-level type definitions.
"""

from datetime import datetime, timezone
from enum import StrEnum


class UserRole(StrEnum):
    """Available user roles for RBAC."""

    USER = "user"
    ADMIN = "admin"


def new_user_document(
    name: str,
    email: str,
    hashed_password: str,
    role: UserRole = UserRole.USER,
) -> dict:
    """Build a fresh user document ready for insertion."""
    return {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role.value,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
