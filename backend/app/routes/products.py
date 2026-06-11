"""
Product routes – public CRUD endpoints with advanced filtering.
"""

from fastapi import APIRouter, Query, status

from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.services.product_service import (
    create_product,
    delete_product,
    get_product,
    list_products,
    update_product,
)
from app.utils.response import success_response

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get(
    "",
    summary="List products with filters",
    responses={200: {"description": "Product list retrieved"}},
)
async def get_products(
    category: str | None = Query(None, description="Filter by category"),
    subcategory: str | None = Query(None, description="Filter by subcategory"),
    brand: str | None = Query(None, description="Filter by brand"),
    color: str | None = Query(None, description="Filter by color"),
    size: str | None = Query(None, description="Filter by size"),
    min_price: float | None = Query(None, ge=0, description="Minimum price"),
    max_price: float | None = Query(None, ge=0, description="Maximum price"),
    search: str | None = Query(None, description="Search in name & description"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort: str = Query("created_at", description="Sort field (prefix with - for desc)"),
) -> dict:
    """
    Retrieve products with optional filtering, search, pagination, and sorting.

    **Filters**: category, subcategory, brand, color, size, min_price, max_price  
    **Search**: case-insensitive regex search across name and description  
    **Sort examples**: `price`, `-price`, `rating`, `name`, `created_at`
    """
    data = await list_products(
        category=category,
        subcategory=subcategory,
        brand=brand,
        color=color,
        size=size,
        min_price=min_price,
        max_price=max_price,
        search=search,
        page=page,
        limit=limit,
        sort=sort,
    )
    return success_response(data=data)


@router.get(
    "/{product_id}",
    summary="Get product by ID",
    responses={
        200: {"description": "Product retrieved"},
        404: {"description": "Product not found"},
    },
)
async def get_product_by_id(product_id: str) -> dict:
    """Fetch a single product by its MongoDB ObjectId."""
    product = await get_product(product_id)
    return success_response(data=product.model_dump())


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a product",
    responses={201: {"description": "Product created"}},
)
async def create_new_product(payload: ProductCreate) -> dict:
    """Create a new product (public for demo; use admin routes in production)."""
    product = await create_product(payload)
    return success_response(data=product.model_dump(), message="Product created", status_code=201)


@router.put(
    "/{product_id}",
    summary="Update a product",
    responses={
        200: {"description": "Product updated"},
        404: {"description": "Product not found"},
    },
)
async def update_existing_product(product_id: str, payload: ProductUpdate) -> dict:
    """Partially update an existing product."""
    product = await update_product(product_id, payload)
    return success_response(data=product.model_dump(), message="Product updated")


@router.delete(
    "/{product_id}",
    summary="Delete a product",
    responses={
        200: {"description": "Product deleted"},
        404: {"description": "Product not found"},
    },
)
async def delete_existing_product(product_id: str) -> dict:
    """Delete a product by ID."""
    data = await delete_product(product_id)
    return success_response(data=data, message="Product deleted")
