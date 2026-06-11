"""
Cart service – add, view, and remove items with product enrichment.
"""

import logging

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.models.cart import cart_item, new_cart_document

logger = logging.getLogger(__name__)


async def _get_or_create_cart(user_id: str) -> dict:
    """Return the user's cart, creating one if it doesn't exist."""
    db = get_database()
    cart = await db.carts.find_one({"user_id": user_id})
    if cart is None:
        doc = new_cart_document(user_id)
        result = await db.carts.insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc
    return cart


async def add_to_cart(user_id: str, product_id: str, quantity: int = 1) -> dict:
    """
    Add a product to the user's cart.

    If the product already exists in the cart, increment the quantity.
    Validates that the product exists and has sufficient stock.
    """
    db = get_database()

    # Validate product
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.get("stock", 0) < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock",
        )

    cart = await _get_or_create_cart(user_id)

    # Check if item already in cart
    items: list[dict] = cart.get("items", [])
    found = False
    for item in items:
        if item["product_id"] == product_id:
            item["quantity"] += quantity
            found = True
            break

    if not found:
        items.append(cart_item(product_id, quantity))

    from datetime import datetime, timezone

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    logger.info("Cart updated for user %s – product %s x%d", user_id, product_id, quantity)
    return await get_cart(user_id)


async def get_cart(user_id: str) -> dict:
    """
    Return the user's cart with enriched product details.
    """
    db = get_database()
    cart = await _get_or_create_cart(user_id)
    items: list[dict] = cart.get("items", [])

    enriched_items: list[dict] = []
    total_amount = 0.0

    for item in items:
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            continue

        if product is None:
            continue

        subtotal = product["price"] * item["quantity"]
        total_amount += subtotal

        enriched_items.append({
            "product_id": item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": item["quantity"],
            "image": product.get("images", [""])[0] if product.get("images") else "",
            "subtotal": round(subtotal, 2),
        })

    return {
        "items": enriched_items,
        "total_items": sum(i["quantity"] for i in enriched_items),
        "total_amount": round(total_amount, 2),
    }


async def remove_from_cart(user_id: str, product_id: str) -> dict:
    """Remove a product from the user's cart entirely."""
    db = get_database()
    cart = await _get_or_create_cart(user_id)
    items: list[dict] = cart.get("items", [])

    original_len = len(items)
    items = [i for i in items if i["product_id"] != product_id]

    if len(items) == original_len:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in cart",
        )

    from datetime import datetime, timezone

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    logger.info("Removed product %s from cart of user %s", product_id, user_id)
    return await get_cart(user_id)
