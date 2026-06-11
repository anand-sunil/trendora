"""
Trendora – AI-Powered Fashion E-Commerce Platform

FastAPI application entry-point with lifecycle management, CORS,
rate-limiting, centralised exception handling, and structured logging.
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import close_mongo_connection, connect_to_mongo
from app.routes import admin, auth, cart, chatbot, orders, products, recommendations
from app.routes.chatbot import limiter

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("trendora")


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup / shutdown lifecycle events."""
    logger.info("Starting Trendora API …")
    await connect_to_mongo()
    logger.info("Trendora API ready.")
    yield
    logger.info("Shutting down Trendora API …")
    await close_mongo_connection()
    logger.info("Trendora API stopped.")


# ── App factory ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Trendora API",
    description=(
        "AI-Powered Fashion E-Commerce Platform.\n\n"
        "Features:\n"
        "- 🔐 JWT Authentication & RBAC\n"
        "- 👗 Product catalog with advanced filtering\n"
        "- 🛒 Shopping cart management\n"
        "- 📦 Order processing with inventory management\n"
        "- 🤖 AI Fashion Assistant with NLP recommendations\n"
        "- 📊 Admin dashboard with sales analytics"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── Middleware ───────────────────────────────────────────────────────────────

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (state bound to app)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Centralised exception handlers ──────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Return a structured 422 with readable error details."""
    errors = []
    for err in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in err.get("loc", [])),
            "message": err.get("msg", ""),
            "type": err.get("type", ""),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "status_code": 422,
            "message": "Validation error",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    _request: Request,
    exc: Exception,
) -> JSONResponse:
    """Catch-all handler – log the traceback and return a clean 500."""
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "status_code": 500,
            "message": "Internal server error",
        },
    )


# ── Route registration ──────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(chatbot.router)
app.include_router(admin.router)
app.include_router(recommendations.router)


# ── Health check ─────────────────────────────────────────────────────────────

@app.get(
    "/",
    tags=["Health"],
    summary="Health check",
    response_model=None,
)
async def root() -> dict:
    """Simple liveness probe."""
    return {
        "status": "healthy",
        "app": "Trendora API",
        "version": "1.0.0",
    }


@app.get(
    "/health",
    tags=["Health"],
    summary="Detailed health check",
    response_model=None,
)
async def health() -> dict:
    """Check API and database connectivity."""
    from app.database import get_database

    try:
        db = get_database()
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app": "Trendora API",
        "version": "1.0.0",
        "database": db_status,
    }
