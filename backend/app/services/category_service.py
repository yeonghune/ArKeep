import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.user import User
from app.schemas.category import BulkDeleteCategoryRequest, CategoryListResponse, CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest
from app.services.auth_service import AppException


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_categories(self, user: User) -> CategoryListResponse:
        result = await self.db.execute(
            select(Category)
            .where(Category.user_id == user.id)
            .order_by(Category.name)
        )
        categories = result.scalars().all()
        return CategoryListResponse(
            categories=[CategoryResponse.model_validate(c) for c in categories]
        )

    async def create_category(self, user: User, body: CreateCategoryRequest) -> CategoryResponse:
        count_result = await self.db.execute(
            select(Category).where(Category.user_id == user.id)
        )
        if len(count_result.scalars().all()) >= 100:
            raise AppException(400, "LIMIT_EXCEEDED", "카테고리는 최대 100개까지 생성할 수 있습니다.")

        result = await self.db.execute(
            select(Category).where(Category.user_id == user.id, Category.name == body.name)
        )
        if result.scalar_one_or_none():
            raise AppException(409, "CONFLICT", "이미 존재하는 카테고리입니다.")

        category = Category(
            user_id=user.id,
            name=body.name,
            created_at=datetime.datetime.now(datetime.timezone.utc),
        )
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return CategoryResponse.model_validate(category)

    async def update_category(self, user: User, category_id: int, body: UpdateCategoryRequest) -> CategoryResponse:
        result = await self.db.execute(
            select(Category).where(Category.id == category_id, Category.user_id == user.id)
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise AppException(404, "NOT_FOUND", "카테고리를 찾을 수 없습니다.")

        dup = await self.db.execute(
            select(Category).where(
                Category.user_id == user.id,
                Category.name == body.name,
                Category.id != category_id,
            )
        )
        if dup.scalar_one_or_none():
            raise AppException(409, "CONFLICT", "이미 존재하는 카테고리입니다.")

        # categories.name만 바꾸면 articles는 category_id FK로 연결되어 있으므로
        # 자동으로 새 이름이 반영됨
        category.name = body.name
        await self.db.commit()
        await self.db.refresh(category)
        return CategoryResponse.model_validate(category)

    async def delete_category(self, user: User, category_id: int) -> None:
        result = await self.db.execute(
            select(Category).where(Category.id == category_id, Category.user_id == user.id)
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise AppException(404, "NOT_FOUND", "카테고리를 찾을 수 없습니다.")

        # ON DELETE SET NULL이 articles.category_id를 자동으로 NULL 처리
        await self.db.execute(
            delete(Category).where(Category.id == category_id)
        )
        await self.db.commit()

    async def bulk_delete_categories(self, user: User, body: BulkDeleteCategoryRequest) -> None:
        if not body.ids:
            return
        await self.db.execute(
            delete(Category).where(
                Category.id.in_(body.ids),
                Category.user_id == user.id,
            )
        )
        await self.db.commit()
