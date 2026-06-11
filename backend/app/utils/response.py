"""
Standardised JSON response helpers.
"""

from typing import Any


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200,
) -> dict:
    """Return a uniform success envelope."""
    return {
        "status": "success",
        "status_code": status_code,
        "message": message,
        "data": data,
    }


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    errors: Any = None,
) -> dict:
    """Return a uniform error envelope."""
    return {
        "status": "error",
        "status_code": status_code,
        "message": message,
        "errors": errors,
    }
