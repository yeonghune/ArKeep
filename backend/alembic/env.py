import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import all models so Alembic can detect them
from app.database import Base
from app.models import article, refresh_token, user  # noqa: F401

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Convert asyncpg URL → psycopg2 for Alembic's synchronous runner
DATABASE_URL = os.environ.get("DATABASE_URL", config.get_main_option("sqlalchemy.url") or "")
SYNC_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")


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
    cfg = config.get_section(config.config_ini_section, {})
    cfg["sqlalchemy.url"] = SYNC_URL
    connectable = engine_from_config(cfg, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
