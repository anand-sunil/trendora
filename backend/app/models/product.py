"""
Product document helpers.
"""

from datetime import datetime, timezone


def new_product_document(
    name: str,
    description: str,
    price: float,
    category: str,
    subcategory: str = "",
    brand: str = "",
    colors: list[str] | None = None,
    sizes: list[str] | None = None,
    stock: int = 0,
    images: list[str] | None = None,
    rating: float = 0.0,
) -> dict:
    """Build a product document ready for insertion."""
    return {
        "name": name,
        "description": description,
        "price": price,
        "category": category,
        "subcategory": subcategory,
        "brand": brand,
        "colors": colors or [],
        "sizes": sizes or [],
        "stock": stock,
        "images": images or [],
        "rating": rating,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
