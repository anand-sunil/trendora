"""
Product service – CRUD + advanced filtering, pagination, and sorting.
"""

import logging
import math
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import get_database
from app.models.product import new_product_document
from app.schemas.product_schema import ProductCreate, ProductOut, ProductUpdate

logger = logging.getLogger(__name__)


def _product_to_out(doc: dict) -> ProductOut:
    """Map a MongoDB product document to ``ProductOut``."""
    return ProductOut(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        price=doc["price"],
        category=doc["category"],
        subcategory=doc.get("subcategory", ""),
        brand=doc.get("brand", ""),
        colors=doc.get("colors", []),
        sizes=doc.get("sizes", []),
        stock=doc.get("stock", 0),
        images=doc.get("images", []),
        rating=doc.get("rating", 0.0),
        created_at=doc.get("created_at", ""),
    )


async def list_products(
    category: str | None = None,
    subcategory: str | None = None,
    brand: str | None = None,
    color: str | None = None,
    size: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
    sort: str = "created_at",
) -> dict:
    """Return a filtered, paginated product list."""
    db = get_database()
    query: dict = {}

    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if subcategory:
        query["subcategory"] = {"$regex": subcategory, "$options": "i"}
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if color:
        query["colors"] = {"$regex": color, "$options": "i"}
    if size:
        query["sizes"] = {"$regex": size, "$options": "i"}

    # Price range
    if min_price is not None or max_price is not None:
        price_filter: dict = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        query["price"] = price_filter

    # Full-text search on name & description
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    # Determine sort direction
    sort_dir = -1
    sort_field = sort
    if sort.startswith("-"):
        sort_field = sort[1:]
        sort_dir = -1
    elif sort.startswith("+"):
        sort_field = sort[1:]
        sort_dir = 1
    else:
        # Default descending for created_at, ascending for price/name
        if sort_field in ("price", "name", "rating"):
            sort_dir = 1

    total = await db.products.count_documents(query)
    skip = (page - 1) * limit

    cursor = (
        db.products.find(query)
        .sort(sort_field, sort_dir)
        .skip(skip)
        .limit(limit)
    )
    products = [_product_to_out(doc) async for doc in cursor]

    return {
        "products": [p.model_dump() for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if limit else 0,
    }


async def get_product(product_id: str) -> ProductOut:
    """Fetch a single product by ID."""
    db = get_database()
    try:
        doc = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")

    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return _product_to_out(doc)


async def create_product(payload: ProductCreate) -> ProductOut:
    """Insert a new product and return it."""
    db = get_database()
    doc = new_product_document(**payload.model_dump())
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    logger.info("Product created: %s", payload.name)
    return _product_to_out(doc)


async def update_product(product_id: str, payload: ProductUpdate) -> ProductOut:
    """Update an existing product (partial update)."""
    db = get_database()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = await db.products.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {"$set": update_data},
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")

    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    logger.info("Product updated: %s", product_id)
    return _product_to_out(result)


async def delete_product(product_id: str) -> dict:
    """Delete a product by ID."""
    db = get_database()
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product ID")

    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    logger.info("Product deleted: %s", product_id)
    return {"deleted": True, "id": product_id}
