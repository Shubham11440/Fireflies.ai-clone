"""Per-request logging middleware for FastAPI."""
from __future__ import annotations

import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from backend.app.logging.logger import CustomLogger
from backend.app.logging.events import Events, EventTypes


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())
        route = str(request.url.path)
        method = request.method

        logger = CustomLogger(
            request_id=request_id,
            route=route,
            method=method,
        )
        logger.start_recording()

        # Attach logger to request state for downstream use
        request.state.logger = logger
        request.state.request_id = request_id

        logger.info({
            "event": Events.REQUEST_RECEIVED,
            "event_type": EventTypes.API,
        })

        response = await call_next(request)

        logger.record_time("total")
        logger.info({
            "event": Events.REQUEST_COMPLETED,
            "event_type": EventTypes.API,
            "status_code": response.status_code,
            "time_taken": logger._record.get("total", 0),
        })

        response.headers["X-Request-ID"] = request_id
        return response
