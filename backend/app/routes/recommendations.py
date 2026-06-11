"""
Personalized recommendation routes.
"""

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import get_current_user
from app.services.recommendation_service import generate_personalized_recommendations
from app.utils.response import success_response

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get(
    "/personalized",
    summary="Get personalized recommendations for the authenticated user",
    responses={
        200: {
            "description": "Recommendations generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "data": {
                            "recommendations": [],
                            "stylist_message": "Based on your interest in shirts, we curated these pieces for you."
                        }
                    }
                }
            }
        },
        401: {"description": "Not authenticated"}
    }
)
async def get_personalized_recommendations_route(
    wishlist: str | None = Query(None, description="Comma-separated product IDs in client-side wishlist"),
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Generate personalized recommendations for the user utilizing their order history,
    shopping cart, chatbot history, and client wishlist items.
    """
    wishlist_ids = []
    if wishlist:
        wishlist_ids = [pid.strip() for pid in wishlist.split(",") if pid.strip()]
        
    data = await generate_personalized_recommendations(
        user_id=current_user["id"],
        wishlist_product_ids=wishlist_ids
    )
    return success_response(data=data, message="Personalized recommendations retrieved")
