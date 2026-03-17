import logging
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

from app.config import get_settings
from app.routers import articles, auth, metadata, profile
from app.services.auth_service import AppException

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(title="ArKeep API", docs_url="/docs", redoc_url=None)

# ─── CORS ────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)

# ─── Request logging ─────────────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    elapsed_ms = int((time.monotonic() - start) * 1000)
    log.info(f"{request.method} {request.url.path} -> {response.status_code} ({elapsed_ms}ms)")
    return response

# ─── Exception handlers ───────────────────────────────────────────────────────

@app.exception_handler(AppException)
async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    msg = errors[0]["msg"] if errors else "Validation error"
    # Pydantic v2 prefixes custom errors with "Value error, " — strip it
    if msg.startswith("Value error, "):
        msg = msg[len("Value error, "):]
    return JSONResponse(status_code=400, content={"code": "BAD_REQUEST", "message": msg})


@app.exception_handler(Exception)
async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    log.exception("Unexpected error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_SERVER_ERROR", "message": "Unexpected server error"},
    )

# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> PlainTextResponse:
    return PlainTextResponse("ok")

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(articles.router)
app.include_router(metadata.router)
app.include_router(profile.router)
