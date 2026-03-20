import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryListResponse, CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest
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
        # 중복 확인
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

        # 중복 확인
        dup = await self.db.execute(
            select(Category).where(
                Category.user_id == user.id,
                Category.name == body.name,
                Category.id != category_id,
            )
        )
        if dup.scalar_one_or_none():
            raise AppException(409, "CONFLICT", "이미 존재하는 카테고리입니다.")

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
        await self.db.execute(
            delete(Category).where(Category.id == category_id)
        )
        await self.db.commit()
