"""
Cart routes – add, view, remove (all authenticated).
"""

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.schemas.cart_schema import CartAddRequest
from app.services.cart_service import add_to_cart, get_cart, remove_from_cart
from app.utils.response import success_response

router = APIRouter(prefix="/api/cart", tags=["Cart"])


@router.post(
    "/add",
    summary="Add item to cart",
    responses={
        200: {"description": "Item added to cart"},
        400: {"description": "Invalid product or insufficient stock"},
        401: {"description": "Not authenticated"},
    },
)
async def add_item(
    payload: CartAddRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Add a product to the authenticated user's cart.

    If the product already exists, its quantity is incremented.
    Validates product existence and available stock.
    """
    data = await add_to_cart(
        user_id=current_user["id"],
        product_id=payload.product_id,
        quantity=payload.quantity,
    )
    return success_response(data=data, message="Item added to cart")


@router.get(
    "",
    summary="View cart",
    responses={
        200: {"description": "Cart retrieved"},
        401: {"description": "Not authenticated"},
    },
)
async def view_cart(current_user: dict = Depends(get_current_user)) -> dict:
    """Return the current user's cart with enriched product details."""
    data = await get_cart(current_user["id"])
    return success_response(data=data)


@router.delete(
    "/remove/{product_id}",
    summary="Remove item from cart",
    responses={
        200: {"description": "Item removed from cart"},
        404: {"description": "Product not in cart"},
        401: {"description": "Not authenticated"},
    },
)
async def remove_item(
    product_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Remove a product from the authenticated user's cart."""
    data = await remove_from_cart(current_user["id"], product_id)
    return success_response(data=data, message="Item removed from cart")
