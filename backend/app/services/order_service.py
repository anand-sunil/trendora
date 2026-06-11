"""
Order service – create orders from cart and retrieve order history.
"""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.config import get_settings
from app.database import get_database
from app.models.order import new_order_document
from app.schemas.order_schema import OrderOut

logger = logging.getLogger(__name__)


def _order_to_out(doc: dict) -> OrderOut:
    """Map a MongoDB order document to ``OrderOut``."""
    return OrderOut(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        products=doc.get("products", []),
        total_amount=doc["total_amount"],
        shipping_address=doc.get("shipping_address", {}),
        payment_status=doc.get("payment_status", "pending"),
        order_status=doc.get("order_status", "processing"),
        created_at=doc.get("created_at", ""),
    )


async def create_order(user_id: str, shipping_address: dict) -> dict:
    """
    Create an order from the current cart contents.

    Validates stock, decrements inventory, clears the cart.
    """
    db = get_database()

    # Fetch cart
    cart = await db.carts.find_one({"user_id": user_id})
    if cart is None or not cart.get("items"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    order_products: list[dict] = []
    total_amount = 0.0

    for item in cart["items"]:
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid product ID: {item['product_id']}",
            )

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product not found: {item['product_id']}",
            )

        if product.get("stock", 0) < item["quantity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for: {product['name']}",
            )

        subtotal = product["price"] * item["quantity"]
        total_amount += subtotal

        order_products.append({
            "product_id": item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": item["quantity"],
            "image": product.get("images", [""])[0] if product.get("images") else "",
        })

    # Decrement stock
    for item in cart["items"]:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}},
        )

    # Create order document
    order_doc = new_order_document(
        user_id=user_id,
        products=order_products,
        total_amount=round(total_amount, 2),
        shipping_address=shipping_address,
    )
    result = await db.products.database.orders.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id

    # Clear cart
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    logger.info("Order created: %s for user %s", result.inserted_id, user_id)
    return _order_to_out(order_doc).model_dump()


async def get_user_orders(user_id: str) -> dict:
    """Return all orders for a user, most recent first."""
    db = get_database()
    cursor = db.orders.find({"user_id": user_id}).sort("created_at", -1)
    orders = [_order_to_out(doc).model_dump() async for doc in cursor]
    return {"orders": orders, "total": len(orders)}


async def get_order_by_id(order_id: str, user_id: str | None = None) -> dict:
    """
    Fetch a single order by ID.

    If ``user_id`` is provided the order must belong to that user.
    """
    db = get_database()
    try:
        query: dict = {"_id": ObjectId(order_id)}
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order ID")

    if user_id is not None:
        query["user_id"] = user_id

    doc = await db.orders.find_one(query)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    return _order_to_out(doc).model_dump()


async def get_all_orders(page: int = 1, limit: int = 20) -> dict:
    """Admin: return all orders with pagination."""
    db = get_database()
    total = await db.orders.count_documents({})
    skip = (page - 1) * limit
    cursor = db.orders.find({}).sort("created_at", -1).skip(skip).limit(limit)
    orders = [_order_to_out(doc).model_dump() async for doc in cursor]
    return {"orders": orders, "total": total, "page": page, "limit": limit}


async def get_sales_summary() -> dict:
    """Admin: aggregate sales statistics."""
    db = get_database()
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_revenue": {"$sum": "$total_amount"},
                "total_orders": {"$sum": 1},
                "avg_order_value": {"$avg": "$total_amount"},
            }
        }
    ]
    result = await db.orders.aggregate(pipeline).to_list(length=1)

    if not result:
        return {
            "total_revenue": 0,
            "total_orders": 0,
            "avg_order_value": 0,
        }

    summary = result[0]
    summary.pop("_id", None)
    summary["total_revenue"] = round(summary["total_revenue"], 2)
    summary["avg_order_value"] = round(summary["avg_order_value"], 2)

    # Orders by status
    status_pipeline = [
        {"$group": {"_id": "$order_status", "count": {"$sum": 1}}}
    ]
    status_results = await db.orders.aggregate(status_pipeline).to_list(length=20)
    summary["orders_by_status"] = {r["_id"]: r["count"] for r in status_results}

    # Orders by payment status
    payment_pipeline = [
        {"$group": {"_id": "$payment_status", "count": {"$sum": 1}}}
    ]
    payment_results = await db.orders.aggregate(payment_pipeline).to_list(length=20)
    summary["orders_by_payment_status"] = {r["_id"]: r["count"] for r in payment_results}

    return summary


# ── Razorpay Integration ──────────────────────────────────────────────────────

def _get_razorpay_client():
    """Build and return a Razorpay API client instance."""
    import razorpay

    settings = get_settings()
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


async def create_razorpay_order(user_id: str) -> dict:
    """Calculate the user's cart total and generate a Razorpay payment order."""
    db = get_database()

    # Fetch user's cart
    cart = await db.carts.find_one({"user_id": user_id})
    if cart is None or not cart.get("items"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    total_amount = 0.0
    for item in cart["items"]:
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            continue
        if product is None:
            continue
        total_amount += product["price"] * item["quantity"]

    if total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cart total amount",
        )

    client = _get_razorpay_client()
    
    # Razorpay amount is represented in paise (1 INR = 100 paise)
    data = {
        "amount": int(total_amount * 100),
        "currency": "INR",
        "receipt": f"r_{user_id}_{int(datetime.now(timezone.utc).timestamp())}",
    }
    
    try:
        razorpay_order = client.order.create(data=data)
        logger.info("Created Razorpay payment order: %s", razorpay_order["id"])
        return {
            "razorpay_order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key_id": get_settings().RAZORPAY_KEY_ID
        }
    except Exception as e:
        logger.error("Failed to create Razorpay order: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate payment gateway session"
        )


async def verify_razorpay_payment(user_id: str, payment_details: dict, shipping_address: dict) -> dict:
    """Cryptographically verify Razorpay transaction signature, create the order, and clear cart."""
    client = _get_razorpay_client()
    
    # 1. Cryptographically verify signature
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': payment_details['razorpay_order_id'],
            'razorpay_payment_id': payment_details['razorpay_payment_id'],
            'razorpay_signature': payment_details['razorpay_signature']
        })
    except Exception as e:
        logger.error("Razorpay signature verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: invalid signature"
        )
        
    # 2. Signature verified! Create the order
    db = get_database()
    
    # Fetch cart
    cart = await db.carts.find_one({"user_id": user_id})
    if cart is None or not cart.get("items"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )
        
    order_products = []
    total_amount = 0.0
    
    for item in cart["items"]:
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid product ID: {item['product_id']}",
            )
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product not found: {item['product_id']}",
            )
        if product.get("stock", 0) < item["quantity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for: {product['name']}",
            )
            
        subtotal = product["price"] * item["quantity"]
        total_amount += subtotal
        
        order_products.append({
            "product_id": item["product_id"],
            "name": product["name"],
            "price": product["price"],
            "quantity": item["quantity"],
            "image": product.get("images", [""])[0] if product.get("images") else ""
        })
        
    # Decrement stock
    for item in cart["items"]:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock": -item["quantity"]}}
        )
        
    # Create order document
    order_doc = new_order_document(
        user_id=user_id,
        products=order_products,
        total_amount=round(total_amount, 2),
        shipping_address=shipping_address
    )
    
    # Add payment metadata
    order_doc["payment_status"] = "paid"
    order_doc["payment_metadata"] = {
        "razorpay_order_id": payment_details['razorpay_order_id'],
        "razorpay_payment_id": payment_details['razorpay_payment_id'],
        "razorpay_signature": payment_details['razorpay_signature']
    }
    
    result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    logger.info("Order created with verified Razorpay payment: %s for user %s", result.inserted_id, user_id)
    return _order_to_out(order_doc).model_dump()

