"""
Application configuration loaded from environment variables.
Uses pydantic-settings for type-safe configuration management.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings sourced from .env file and environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    MONGO_URI: str
    DATABASE_NAME: str = "trendora"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    GROQ_API_KEY: str
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()  # type: ignore[call-arg]
