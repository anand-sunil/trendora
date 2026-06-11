"""
Order routes – create order, view history, get single order.
"""

from fastapi import APIRouter, Depends, status

from app.dependencies.auth import get_current_user
from app.schemas.order_schema import OrderCreateRequest, VerifyPaymentRequest
from app.services.order_service import (
    create_order,
    get_order_by_id,
    get_user_orders,
    create_razorpay_order,
    verify_razorpay_payment,
)
from app.utils.response import success_response

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post(
    "/create",
    status_code=status.HTTP_201_CREATED,
    summary="Create order from cart",
    responses={
        201: {"description": "Order created successfully"},
        400: {"description": "Cart is empty or insufficient stock"},
        401: {"description": "Not authenticated"},
    },
)
async def create_new_order(
    payload: OrderCreateRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Convert the current cart into an order.

    - Validates stock for all items
    - Decrements product inventory
    - Clears the cart after order creation
    """
    data = await create_order(
        user_id=current_user["id"],
        shipping_address=payload.shipping_address.model_dump(),
    )
    return success_response(data=data, message="Order created successfully", status_code=201)


@router.get(
    "/my-orders",
    summary="Get current user's orders",
    responses={
        200: {"description": "Order history retrieved"},
        401: {"description": "Not authenticated"},
    },
)
async def my_orders(current_user: dict = Depends(get_current_user)) -> dict:
    """Return all orders for the authenticated user, most recent first."""
    data = await get_user_orders(current_user["id"])
    return success_response(data=data)


@router.get(
    "/{order_id}",
    summary="Get order by ID",
    responses={
        200: {"description": "Order retrieved"},
        404: {"description": "Order not found"},
        401: {"description": "Not authenticated"},
    },
)
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Fetch a specific order (must belong to the current user)."""
    data = await get_order_by_id(order_id, user_id=current_user["id"])
    return success_response(data=data)


@router.post(
    "/create-payment-session",
    summary="Create a Razorpay payment order session",
    responses={
        200: {"description": "Payment session created"},
        400: {"description": "Cart is empty"},
        401: {"description": "Not authenticated"}
    }
)
async def create_payment_session(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Create a Razorpay payment session with key, order ID, and amount."""
    data = await create_razorpay_order(current_user["id"])
    return success_response(data=data, message="Payment session created successfully")


@router.post(
    "/verify-payment",
    summary="Verify Razorpay cryptographic signature and record the order",
    responses={
        200: {"description": "Payment verified and order created"},
        400: {"description": "Invalid payment signature"},
        401: {"description": "Not authenticated"}
    }
)
async def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Verify payment signature and construct the corresponding order in MongoDB."""
    data = await verify_razorpay_payment(
        user_id=current_user["id"],
        payment_details=payload.payment_details.model_dump(),
        shipping_address=payload.shipping_address.model_dump()
    )
    return success_response(data=data, message="Payment verified and order created successfully")

