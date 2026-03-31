from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.rate_limiter import limiter
from app.schemas.auth import AuthResponse, GoogleLoginRequest
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

COOKIE_NAME = "arkeep_refresh_token"
COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRATION_MS // 1000


def _set_refresh_cookie(response: Response, jti: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=jti,
        httponly=True,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=COOKIE_MAX_AGE,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value="",
        httponly=True,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        samesite="lax",
        path="/",
        max_age=0,
    )


@router.post("/google", response_model=AuthResponse)
@limiter.limit("10/minute")
async def google_login(
    request: Request,
    body: GoogleLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    svc = AuthService(db)
    auth_response, refresh_jti = await svc.login_with_google(body.idToken)
    _set_refresh_cookie(response, refresh_jti)
    return auth_response


@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("30/minute")
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    arkeep_refresh_token: str | None = Cookie(default=None),
) -> AuthResponse:
    svc = AuthService(db)
    auth_response, new_jti = await svc.refresh(arkeep_refresh_token)
    _set_refresh_cookie(response, new_jti)
    return auth_response


@router.delete("/me", status_code=204)
async def delete_account(
    response: Response,
    db: AsyncSession = Depends(get_db),
    arkeep_refresh_token: str | None = Cookie(default=None),
    current_user: User = Depends(get_current_user),
) -> None:
    svc = AuthService(db)
    await svc.delete_account(current_user)
    _clear_refresh_cookie(response)


@router.post("/logout")
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    arkeep_refresh_token: str | None = Cookie(default=None),
    _current_user: User = Depends(get_current_user),
) -> dict:
    svc = AuthService(db)
    await svc.logout(arkeep_refresh_token)
    _clear_refresh_cookie(response)
    return {"message": "Logged out"}
