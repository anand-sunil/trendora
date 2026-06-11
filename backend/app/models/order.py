"""
Order document helpers and status enumerations.
"""

from datetime import datetime, timezone
from enum import StrEnum


class PaymentStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"


class OrderStatus(StrEnum):
    PROCESSING = "processing"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


def new_order_document(
    user_id: str,
    products: list[dict],
    total_amount: float,
    shipping_address: dict | None = None,
) -> dict:
    """Build an order document ready for insertion."""
    return {
        "user_id": user_id,
        "products": products,
        "total_amount": total_amount,
        "shipping_address": shipping_address or {},
        "payment_status": PaymentStatus.PENDING.value,
        "order_status": OrderStatus.PROCESSING.value,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
