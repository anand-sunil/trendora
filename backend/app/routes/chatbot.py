"""
AI Fashion Chatbot routes with rate limiting.
"""

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies.auth import get_optional_user
from app.services.recommendation_service import get_recommendations, generate_outfit
from app.utils.response import success_response

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/chatbot", tags=["AI Chatbot"])


class ChatRequest(BaseModel):
    """Body for the chatbot recommendation endpoint."""

    message: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=["I need a black shirt under 1000 rupees"],
    )
    limit: int = Field(10, ge=1, le=50, description="Max recommendations to return")


class OutfitRequest(BaseModel):
    """Body for the outfit generator endpoint."""

    message: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=["Create a smart casual outfit under ₹4000"],
    )


class OutfitItem(BaseModel):
    """Details of a single item in a curated outfit."""
    id: str
    name: str
    price: float
    image: str = ""
    category: str = ""
    brand: str = ""


class OutfitCurated(BaseModel):
    """Curated items constituting a complete outfit."""
    top: OutfitItem | None = None
    bottom: OutfitItem | None = None
    footwear: OutfitItem | None = None


class OutfitResponse(BaseModel):
    """Response returned by the outfit generator endpoint."""
    stylist_message: str
    outfit: OutfitCurated
    total_price: float


@router.post(
    "/recommend",
    summary="Get AI fashion recommendations",
    responses={
        200: {
            "description": "Recommendations returned",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "data": {
                            "filters": {
                                "category": "shirt",
                                "color": "black",
                                "size": "",
                                "gender": "",
                                "occasion": "",
                                "style": "",
                                "budget": 1000
                            },
                            "recommendations": [],
                            "stylist_response": "Here is a selection of black shirts under ₹1000 matching your request.",
                            "total": 0,
                        },
                    }
                }
            },
        },
        429: {"description": "Rate limit exceeded"},
    },
)
@limiter.limit("30/minute")
async def recommend(
    request: Request,
    payload: ChatRequest,
    current_user: dict | None = Depends(get_optional_user)
) -> dict:
    """
    Parse a natural-language fashion query and return scored product
    recommendations along with a personalized stylist response.
    """
    user_id = current_user["id"] if current_user else None
    data = await get_recommendations(payload.message, limit=payload.limit, user_id=user_id)
    return success_response(data=data, message="Recommendations generated")


@router.post(
    "/outfit-generator",
    summary="Generate a complete fashion outfit matching filters and budget",
    response_model=None,
    responses={
        200: {
            "description": "Outfit curated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "data": {
                            "stylist_message": "This minimalist outfit combination suits your budget perfectly.",
                            "outfit": {
                                "top": {"id": "123", "name": "Classic White Tee", "price": 999.0, "image": "", "category": "shirt", "brand": "Trendora"},
                                "bottom": {"id": "456", "name": "Slim Fit Jeans", "price": 1999.0, "image": "", "category": "jeans", "brand": "Trendora"},
                                "footwear": {"id": "789", "name": "Minimal Sneakers", "price": 999.0, "image": "", "category": "shoes", "brand": "Trendora"}
                            },
                            "total_price": 3997.0
                        }
                    }
                }
            }
        },
        429: {"description": "Rate limit exceeded"},
    }
)
@limiter.limit("20/minute")
async def outfit_generator(
    request: Request,
    payload: OutfitRequest,
    current_user: dict | None = Depends(get_optional_user)
) -> dict:
    """
    Generate a curated outfit containing a top, bottom, and footwear matching 
    the style request, occasion, gender, and total budget.
    """
    user_id = current_user["id"] if current_user else None
    data = await generate_outfit(payload.message, user_id=user_id)
    return success_response(data=data, message="Outfit generated successfully")
