"""add article tags array

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-31
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(length=50)),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )
    op.alter_column("articles", "tags", server_default=None)


def downgrade() -> None:
    op.drop_column("articles", "tags")

