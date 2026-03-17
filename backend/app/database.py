from collections.abc import AsyncGenerator

from sqlalchemy import URL
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()


def _make_async_url() -> URL | str:
    """Build asyncpg URL safely using individual POSTGRES_* vars when available.

    Falls back to DATABASE_URL string when individual vars are not set.
    Using URL.create() avoids URL-parsing issues with special characters (e.g. '#') in passwords.
    """
    if settings.POSTGRES_USER and settings.POSTGRES_PASSWORD and settings.POSTGRES_DB:
        return URL.create(
            drivername="postgresql+asyncpg",
            username=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
        )
    return settings.DATABASE_URL


engine = create_async_engine(_make_async_url(), pool_pre_ping=True, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
