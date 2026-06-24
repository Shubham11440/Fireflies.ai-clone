"""Application error hierarchy and FastAPI exception handlers."""
from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str = "Resource", resource_id: str = ""):
        msg = f"{resource} not found" + (f": {resource_id}" if resource_id else "")
        super().__init__(message=msg, code="NOT_FOUND", status_code=404)


class ValidationError(AppError):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message=message, code="VALIDATION_ERROR", status_code=400)


class ConflictError(AppError):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message=message, code="CONFLICT", status_code=409)


class SummaryError(AppError):
    def __init__(self, message: str = "Summary generation failed"):
        super().__init__(message=message, code="SUMMARY_ERROR", status_code=500)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )


async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "code": "INTERNAL_ERROR"},
    )
