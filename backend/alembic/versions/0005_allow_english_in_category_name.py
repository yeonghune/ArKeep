"""allow english in category name

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-22
"""
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("ck_categories_allowed_chars", "categories")
    op.create_check_constraint(
        "ck_categories_allowed_chars",
        "categories",
        r"name ~ '^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$'",
    )


def downgrade() -> None:
    op.drop_constraint("ck_categories_allowed_chars", "categories")
    op.create_check_constraint(
        "ck_categories_allowed_chars",
        "categories",
        r"name ~ '^[가-힣ㄱ-ㅎㅏ-ㅣ0-9 ]+$'",
    )
