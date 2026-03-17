from collections.abc import AsyncGenerator

import jwt
from fastapi import Cookie, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.services.auth_service import AppException

settings = get_settings()
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise AppException(401, "UNAUTHORIZED", "Authentication required")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        provider_user_id: str | None = payload.get("sub")
        if not provider_user_id:
            raise AppException(401, "UNAUTHORIZED", "Authentication required")
    except jwt.ExpiredSignatureError:
        raise AppException(401, "UNAUTHORIZED", "Authentication required")
    except jwt.InvalidTokenError:
        raise AppException(401, "UNAUTHORIZED", "Authentication required")

    result = await db.execute(
        select(User).where(User.provider == "GOOGLE", User.provider_user_id == provider_user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise AppException(401, "UNAUTHORIZED", "Authentication required")
    return user
