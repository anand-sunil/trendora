"""
JWT token creation and decoding.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import get_settings


def create_access_token(data: dict) -> str:
    """Create a signed JWT containing *data* with an expiry claim."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate a JWT.

    Returns the payload dict on success, or ``None`` if the token is
    invalid / expired.
    """
    settings = get_settings()
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        return None
