"""
Pydantic V2 schemas for products.
"""

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    """Body for creating a new product."""

    name: str = Field(..., min_length=1, max_length=200, examples=["Classic Black Shirt"])
    description: str = Field("", max_length=2000, examples=["Premium cotton black shirt"])
    price: float = Field(..., gt=0, examples=[999.0])
    category: str = Field(..., min_length=1, examples=["shirts"])
    subcategory: str = Field("", examples=["formal"])
    brand: str = Field("", examples=["Raymond"])
    colors: list[str] = Field(default_factory=list, examples=[["black", "navy"]])
    sizes: list[str] = Field(default_factory=list, examples=[["S", "M", "L", "XL"]])
    stock: int = Field(0, ge=0, examples=[50])
    images: list[str] = Field(default_factory=list, examples=[["https://img.example.com/shirt1.jpg"]])
    rating: float = Field(0.0, ge=0, le=5, examples=[4.5])


class ProductUpdate(BaseModel):
    """Partial update schema – all fields optional."""

    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    price: float | None = Field(None, gt=0)
    category: str | None = None
    subcategory: str | None = None
    brand: str | None = None
    colors: list[str] | None = None
    sizes: list[str] | None = None
    stock: int | None = Field(None, ge=0)
    images: list[str] | None = None
    rating: float | None = Field(None, ge=0, le=5)


class ProductOut(BaseModel):
    """Product response representation."""

    id: str
    name: str
    description: str
    price: float
    category: str
    subcategory: str
    brand: str
    colors: list[str]
    sizes: list[str]
    stock: int
    images: list[str]
    rating: float
    created_at: str


class ProductListResponse(BaseModel):
    """Paginated product list."""

    products: list[ProductOut]
    total: int
    page: int
    limit: int
    total_pages: int
