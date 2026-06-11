"""
Async MongoDB connection management using Motor.
Provides a shared database handle and lifecycle hooks for FastAPI.
"""

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Initialise the Motor client and ping the database."""
    global _client, _database
    settings = get_settings()
    import certifi
    _client = AsyncIOMotorClient(
        settings.MONGO_URI,
        maxPoolSize=50,
        minPoolSize=10,
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where(),
    )
    _database = _client[settings.DATABASE_NAME]
    # Verify connectivity
    await _client.admin.command("ping")
    logger.info("Connected to MongoDB Atlas – database: %s", settings.DATABASE_NAME)


async def close_mongo_connection() -> None:
    """Gracefully close the Motor client."""
    global _client, _database
    if _client is not None:
        _client.close()
        _client = None
        _database = None
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database handle. Raises if not connected."""
    if _database is None:
        raise RuntimeError("Database not initialised. Call connect_to_mongo() first.")
    return _database
