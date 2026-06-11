"""
Cart document helpers.
"""

from datetime import datetime, timezone


def new_cart_document(user_id: str) -> dict:
    """Build an empty cart document for a user."""
    return {
        "user_id": user_id,
        "items": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def cart_item(product_id: str, quantity: int = 1) -> dict:
    """Build a single cart-item sub-document."""
    return {
        "product_id": product_id,
        "quantity": quantity,
    }
