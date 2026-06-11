"""
Admin routes – product management, order management, sales analytics,
and user listing. All routes require the ``admin`` role.
"""

from fastapi import APIRouter, Depends, Query, status

from app.database import get_database
from app.dependencies.auth import require_admin
from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.services.order_service import get_all_orders, get_sales_summary
from app.services.product_service import create_product, delete_product, update_product
from app.utils.response import success_response

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Product management ───────────────────────────────────────────────────────

@router.post(
    "/products",
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create product",
    responses={
        201: {"description": "Product created"},
        403: {"description": "Admin access required"},
    },
)
async def admin_create_product(
    payload: ProductCreate,
    _admin: dict = Depends(require_admin),
) -> dict:
    """Create a new product (admin only)."""
    product = await create_product(payload)
    return success_response(data=product.model_dump(), message="Product created", status_code=201)


@router.put(
    "/products/{product_id}",
    summary="[Admin] Update product",
    responses={
        200: {"description": "Product updated"},
        403: {"description": "Admin access required"},
        404: {"description": "Product not found"},
    },
)
async def admin_update_product(
    product_id: str,
    payload: ProductUpdate,
    _admin: dict = Depends(require_admin),
) -> dict:
    """Update an existing product (admin only)."""
    product = await update_product(product_id, payload)
    return success_response(data=product.model_dump(), message="Product updated")


@router.delete(
    "/products/{product_id}",
    summary="[Admin] Delete product",
    responses={
        200: {"description": "Product deleted"},
        403: {"description": "Admin access required"},
        404: {"description": "Product not found"},
    },
)
async def admin_delete_product(
    product_id: str,
    _admin: dict = Depends(require_admin),
) -> dict:
    """Delete a product (admin only)."""
    data = await delete_product(product_id)
    return success_response(data=data, message="Product deleted")


# ── Order management ─────────────────────────────────────────────────────────

@router.get(
    "/orders",
    summary="[Admin] List all orders",
    responses={
        200: {"description": "All orders retrieved"},
        403: {"description": "Admin access required"},
    },
)
async def admin_list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _admin: dict = Depends(require_admin),
) -> dict:
    """Retrieve all orders across all users with pagination."""
    data = await get_all_orders(page=page, limit=limit)
    return success_response(data=data)


# ── Sales analytics ──────────────────────────────────────────────────────────

@router.get(
    "/sales",
    summary="[Admin] Sales summary",
    responses={
        200: {"description": "Sales analytics returned"},
        403: {"description": "Admin access required"},
    },
)
async def admin_sales(
    _admin: dict = Depends(require_admin),
) -> dict:
    """
    Return aggregated sales statistics:
    - Total revenue
    - Total orders
    - Average order value
    - Orders by status
    - Orders by payment status
    """
    data = await get_sales_summary()
    return success_response(data=data)


# ── User management ─────────────────────────────────────────────────────────

@router.get(
    "/users",
    summary="[Admin] List all users",
    responses={
        200: {"description": "All users retrieved"},
        403: {"description": "Admin access required"},
    },
)
async def admin_list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _admin: dict = Depends(require_admin),
) -> dict:
    """List all registered users (passwords excluded)."""
    db = get_database()
    total = await db.users.count_documents({})
    skip = (page - 1) * limit
    cursor = (
        db.users.find({}, {"password": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    users = []
    async for user in cursor:
        users.append({
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "created_at": user.get("created_at", ""),
        })

    return success_response(data={"users": users, "total": total, "page": page, "limit": limit})
