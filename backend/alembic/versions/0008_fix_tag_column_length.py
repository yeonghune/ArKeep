"""fix tag column length from 50 to 20

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-31
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "articles",
        "tags",
        type_=postgresql.ARRAY(sa.String(20)),
        existing_type=postgresql.ARRAY(sa.String(50)),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "articles",
        "tags",
        type_=postgresql.ARRAY(sa.String(50)),
        existing_type=postgresql.ARRAY(sa.String(20)),
        existing_nullable=False,
    )
