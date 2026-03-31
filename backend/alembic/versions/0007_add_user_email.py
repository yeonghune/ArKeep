"""add user email column

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-31
"""

from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "email")
