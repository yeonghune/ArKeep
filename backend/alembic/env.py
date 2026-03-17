import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import URL as SA_URL

# Import all models so Alembic can detect them
from app.database import Base
from app.models import article, refresh_token, user  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _make_sync_url() -> SA_URL:
    """
    Build a psycopg2 connection URL for Alembic.
    Uses individual POSTGRES_* vars via SA_URL.create() to safely handle
    special characters in passwords — avoids URL-string parsing issues.
    Falls back to DATABASE_URL string conversion if vars are not set.
    """
    user = os.environ.get("POSTGRES_USER")
    password = os.environ.get("POSTGRES_PASSWORD")
    host = os.environ.get("POSTGRES_HOST", "db")
    port = int(os.environ.get("POSTGRES_PORT", "5432"))
    database = os.environ.get("POSTGRES_DB")

    if user and password and database:
        return SA_URL.create(
            drivername="postgresql+psycopg2",
            username=user,
            password=password,  # SA_URL.create handles encoding internally
            host=host,
            port=port,
            database=database,
        )

    # Fallback: raw string conversion (works only if password has no special chars)
    raw = os.environ.get("DATABASE_URL", config.get_main_option("sqlalchemy.url") or "")
    return raw.replace("postgresql+asyncpg://", "postgresql+psycopg2://")


SYNC_URL = _make_sync_url()


def run_migrations_offline() -> None:
    context.configure(
        url=SYNC_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        {"sqlalchemy.url": SYNC_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
