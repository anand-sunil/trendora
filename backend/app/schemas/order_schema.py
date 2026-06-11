"""
Pydantic V2 schemas for orders.
"""

from pydantic import BaseModel, Field


class OrderProductItem(BaseModel):
    """A product line-item in an order."""

    product_id: str
    name: str
    price: float
    quantity: int
    image: str = ""


class ShippingAddress(BaseModel):
    """Shipping address for an order."""

    full_name: str = Field(..., min_length=1, examples=["Anand Kumar"])
    phone: str = Field(..., examples=["+91-9876543210"])
    address_line1: str = Field(..., examples=["42, MG Road"])
    address_line2: str = Field("", examples=["Near City Mall"])
    city: str = Field(..., examples=["Bangalore"])
    state: str = Field(..., examples=["Karnataka"])
    postal_code: str = Field(..., examples=["560001"])
    country: str = Field("India", examples=["India"])


class OrderCreateRequest(BaseModel):
    """Body for POST /api/orders/create."""

    shipping_address: ShippingAddress


class RazorpayPaymentDetails(BaseModel):
    """Details returned by Razorpay callback."""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentRequest(BaseModel):
    """Body for payment verification endpoint."""
    payment_details: RazorpayPaymentDetails
    shipping_address: ShippingAddress


class OrderOut(BaseModel):
    """Order response representation."""

    id: str
    user_id: str
    products: list[OrderProductItem]
    total_amount: float
    shipping_address: dict
    payment_status: str
    order_status: str
    created_at: str


class OrderListResponse(BaseModel):
    """List of orders."""

    orders: list[OrderOut]
    total: int
