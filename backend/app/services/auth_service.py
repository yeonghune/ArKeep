"""
Auth service — Google OAuth login, JWT issuance, refresh token rotation.
Mirrors Java AuthService exactly (family-based revocation, JTI format, etc.).
"""

import datetime
import uuid

import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import AuthResponse

settings = get_settings()

PROVIDER = "GOOGLE"
COOKIE_NAME = "arkeep_refresh_token"


class AppException(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message


# ─── JWT helpers ─────────────────────────────────────────────────────────────

def _create_access_token(provider_user_id: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(milliseconds=settings.JWT_EXPIRATION_MS)
    payload = {"sub": provider_user_id, "iat": now, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def _generate_jti() -> str:
    """Format: UUID.UUID — same as Java's randomUUID().toString() + "." + randomUUID()"""
    return f"{uuid.uuid4()}.{uuid.uuid4()}"


def _issue_token_pair(provider_user_id: str) -> tuple[str, str]:
    """Returns (access_token, refresh_jti)"""
    return _create_access_token(provider_user_id), _generate_jti()


# ─── Google OAuth ─────────────────────────────────────────────────────────────

def _verify_google_token(id_token_str: str) -> dict:
    client_ids = settings.google_client_id_list
    last_exc: Exception | None = None
    for client_id in client_ids:
        try:
            payload = google_id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                audience=client_id,
            )
            return payload
        except Exception as exc:
            last_exc = exc
    raise AppException(400, "BAD_REQUEST", f"Invalid Google id token: {last_exc}")


# ─── AuthService ─────────────────────────────────────────────────────────────

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def login_with_google(self, id_token_str: str) -> tuple[AuthResponse, str]:
        """Verify Google token, upsert user, issue JWT pair. Returns (AuthResponse, refresh_jti)."""
        payload = _verify_google_token(id_token_str)
        subject = payload["sub"]
        name = payload.get("name") or payload.get("email") or subject
        picture = payload.get("picture")

        # Upsert user
        result = await self.db.execute(
            select(User).where(User.provider == PROVIDER, User.provider_user_id == subject)
        )
        user = result.scalar_one_or_none()

        now = datetime.datetime.now(datetime.timezone.utc)
        if user is None:
            user = User(
                provider=PROVIDER,
                provider_user_id=subject,
                display_name=name,
                avatar_url=picture,
                created_at=now,
            )
            self.db.add(user)
            await self.db.flush()
        else:
            user.display_name = name
            user.avatar_url = picture

        # Issue tokens
        access_token, refresh_jti = _issue_token_pair(subject)
        family_id = str(uuid.uuid4())
        expires_at = now + datetime.timedelta(milliseconds=settings.REFRESH_TOKEN_EXPIRATION_MS)

        rt = RefreshToken(
            user_id=user.id,
            jti=refresh_jti,
            family_id=family_id,
            issued_at=now,
            expires_at=expires_at,
            revoked=False,
        )
        self.db.add(rt)
        await self.db.commit()

        return AuthResponse(token=access_token, email=payload.get("email") or subject), refresh_jti

    async def refresh(self, refresh_jti: str | None) -> tuple[AuthResponse, str]:
        """Rotate refresh token. Returns (AuthResponse, new_refresh_jti)."""
        if not refresh_jti:
            raise AppException(401, "UNAUTHORIZED", "Invalid refresh token")

        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.jti == refresh_jti)
        )
        token = result.scalar_one_or_none()

        now = datetime.datetime.now(datetime.timezone.utc)

        if token is None or token.expires_at.replace(tzinfo=datetime.timezone.utc) < now:
            raise AppException(401, "UNAUTHORIZED", "Invalid refresh token")

        if token.revoked:
            # Token reuse detected — revoke entire family
            await self.db.execute(
                update(RefreshToken)
                .where(
                    RefreshToken.user_id == token.user_id,
                    RefreshToken.family_id == token.family_id,
                    RefreshToken.revoked == False,  # noqa: E712
                )
                .values(revoked=True)
            )
            await self.db.commit()
            raise AppException(401, "UNAUTHORIZED", "Refresh token reuse detected")

        # Revoke current token
        token.revoked = True

        # Load user
        user_result = await self.db.execute(select(User).where(User.id == token.user_id))
        user = user_result.scalar_one_or_none()
        if user is None:
            raise AppException(401, "UNAUTHORIZED", "Invalid refresh token")

        # Issue new token pair (same family)
        access_token, new_jti = _issue_token_pair(user.provider_user_id)
        expires_at = now + datetime.timedelta(milliseconds=settings.REFRESH_TOKEN_EXPIRATION_MS)

        new_rt = RefreshToken(
            user_id=user.id,
            jti=new_jti,
            family_id=token.family_id,
            issued_at=now,
            expires_at=expires_at,
            revoked=False,
        )
        self.db.add(new_rt)
        await self.db.commit()

        return AuthResponse(token=access_token, email=user.provider_user_id), new_jti

    async def logout(self, refresh_jti: str | None) -> None:
        """Revoke the given refresh token (and its family)."""
        if not refresh_jti:
            return
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.jti == refresh_jti)
        )
        token = result.scalar_one_or_none()
        if token and not token.revoked:
            await self.db.execute(
                update(RefreshToken)
                .where(
                    RefreshToken.user_id == token.user_id,
                    RefreshToken.family_id == token.family_id,
                    RefreshToken.revoked == False,  # noqa: E712
                )
                .values(revoked=True)
            )
            await self.db.commit()
