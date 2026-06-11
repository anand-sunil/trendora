"""
Pydantic V2 schemas for the shopping cart.
"""

from pydantic import BaseModel, Field


class CartAddRequest(BaseModel):
    """Body for POST /api/cart/add."""

    product_id: str = Field(..., examples=["665e..."])
    quantity: int = Field(1, ge=1, examples=[2])


class CartItemOut(BaseModel):
    """A single item inside the cart (enriched with product details)."""

    product_id: str
    name: str
    price: float
    quantity: int
    image: str = ""
    subtotal: float


class CartOut(BaseModel):
    """Full cart response."""

    items: list[CartItemOut]
    total_items: int
    total_amount: float
