"""Fireflies Clone API — FastAPI application entry point."""
from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.db import init_db, close_db
from backend.app.errors import AppError, app_error_handler, generic_error_handler
from backend.app.logging.middleware import LoggingMiddleware
from backend.app.routers import meetings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: run migrations
    await init_db()
    yield
    # Shutdown: close DB pool
    await close_db()


app = FastAPI(
    title="Fireflies Clone API",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Logging middleware ────────────────────────────────────────
app.add_middleware(LoggingMiddleware)

# ── Error handlers ───────────────────────────────────────────
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

# ── Routers ──────────────────────────────────────────────────
app.include_router(meetings.router)


# ── Health check ─────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok"}
