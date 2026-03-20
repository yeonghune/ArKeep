"""migrate articles.category string to category_id FK

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-20
"""
import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. category_id FK 컬럼 추가
    op.add_column("articles", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_articles_category_id",
        "articles", "categories",
        ["category_id"], ["id"],
        ondelete="SET NULL",
    )

    # 2. 기존 문자열 데이터를 FK로 마이그레이션
    op.execute("""
        UPDATE articles a
        SET category_id = c.id
        FROM categories c
        WHERE a.user_id = c.user_id AND a.category = c.name
    """)

    # 3. 구 인덱스 및 컬럼 삭제
    op.drop_index("idx_articles_category", table_name="articles")
    op.drop_column("articles", "category")

    # 4. 새 인덱스 추가
    op.create_index("idx_articles_category_id", "articles", ["category_id"])


def downgrade() -> None:
    op.drop_index("idx_articles_category_id", table_name="articles")
    op.drop_constraint("fk_articles_category_id", "articles", type_="foreignkey")
    op.drop_column("articles", "category_id")
    op.add_column("articles", sa.Column("category", sa.String(100), nullable=True))
    op.create_index("idx_articles_category", "articles", ["category"])
