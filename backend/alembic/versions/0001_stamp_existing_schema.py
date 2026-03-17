"""stamp existing schema — no DDL changes

Revision ID: 0001
Revises:
Create Date: 2026-03-17

This migration exists solely to establish the Alembic baseline against the
schema that was previously managed by Hibernate (ddl-auto: update).
No DDL is executed — run `alembic stamp 0001` on first deploy instead of
`alembic upgrade head`.
"""

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Schema already exists — nothing to create.
    pass


def downgrade() -> None:
    pass
