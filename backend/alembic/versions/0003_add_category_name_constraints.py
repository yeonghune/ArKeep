"""add category name constraints

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-20
"""
import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 기존 데이터 정리: 15자 초과 → 잘라내기, 허용 문자 외 → 삭제
    op.execute("DELETE FROM categories WHERE name !~ '^[가-힣ㄱ-ㅎㅏ-ㅣ0-9 ]+$'")
    op.execute("UPDATE categories SET name = LEFT(name, 15) WHERE LENGTH(name) > 15")
    op.execute("DELETE FROM categories WHERE name = '모든 카테고리'")

    # 컬럼 길이 100 → 15
    op.alter_column(
        "categories",
        "name",
        existing_type=sa.String(100),
        type_=sa.String(15),
        existing_nullable=False,
    )
    # 예약어 제약
    op.create_check_constraint(
        "ck_categories_not_reserved",
        "categories",
        "name != '모든 카테고리'",
    )
    # 허용 문자 제약 (한글·숫자·공백만)
    op.create_check_constraint(
        "ck_categories_allowed_chars",
        "categories",
        r"name ~ '^[가-힣ㄱ-ㅎㅏ-ㅣ0-9 ]+$'",
    )


def downgrade() -> None:
    op.drop_constraint("ck_categories_allowed_chars", "categories")
    op.drop_constraint("ck_categories_not_reserved", "categories")
    op.alter_column(
        "categories",
        "name",
        existing_type=sa.String(15),
        type_=sa.String(100),
        existing_nullable=False,
    )
