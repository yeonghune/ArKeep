"""
Article service — CRUD, pagination, facets, migration.
Mirrors Java ArticleService exactly (1-based pages, search on title, etc.).
"""

import datetime
import uuid
from urllib.parse import urlparse

from sqlalchemy import asc, desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article
from app.models.category import Category
from app.models.user import User
from app.schemas.article import (
    ArticleCursorResponse,
    ArticleMigrationRequest,
    ArticleMigrationResponse,
    ArticleResponse,
    BulkActionResponse,
    BulkDeleteRequest,
    BulkFilter,
    BulkUpdateRequest,
    CreateArticleRequest,
    MigrationItem,
    UpdateArticleRequest,
)
from app.services.auth_service import AppException
from app.services.og_extractor import extract_og_metadata

DEFAULT_DESCRIPTION = ""
MAX_PAGE_SIZE = 8
MAX_TAGS = 5
MAX_TAG_LEN = 20


def _normalize_tags(raw: list[str] | None) -> list[str]:
    if not raw:
        return []
    out: list[str] = []
    seen: set[str] = set()
    for t in raw:
        if t is None:
            continue
        v = " ".join(str(t).strip().split()).lstrip("#")
        if not v:
            continue
        if len(v) > MAX_TAG_LEN:
            raise AppException(400, "BAD_REQUEST", f"Tag must be at most {MAX_TAG_LEN} characters")
        key = v
        if key in seen:
            continue
        seen.add(key)
        out.append(v)
        if len(out) > MAX_TAGS:
            raise AppException(400, "BAD_REQUEST", f"Tags must be at most {MAX_TAGS}")
    return out


def _extract_domain(url: str) -> str:
    try:
        hostname = urlparse(url).hostname or ""
        return hostname.lower() or "unknown"
    except Exception:
        return "unknown"


def _to_response(article: Article) -> ArticleResponse:
    return ArticleResponse(
        id=article.id,
        publicId=article.public_id,
        url=article.url,
        title=article.title,
        description=article.description,
        thumbnailUrl=article.thumbnail_url,
        domain=article.domain,
        category=article.category.name if article.category else None,
        isRead=article.is_read,
        tags=list(article.tags or []),
        createdAt=article.created_at,
    )


async def _apply_bulk_filters(db: AsyncSession, stmt, user_id: int, filters: "BulkFilter | None"):
    """SELECT 문에 bulk 필터 조건을 적용합니다."""
    if filters is None:
        return stmt
    if filters.isRead is not None:
        stmt = stmt.where(Article.is_read == filters.isRead)
    if filters.q:
        if filters.searchField == "url":
            stmt = stmt.where(func.lower(Article.url).contains(filters.q.lower()))
        else:
            stmt = stmt.where(func.lower(Article.title).contains(filters.q.lower()))
    if filters.category:
        cat_result = await db.execute(
            select(Category).where(Category.user_id == user_id, Category.name == filters.category)
        )
        cat = cat_result.scalar_one_or_none()
        cat_id = cat.id if cat else None
        stmt = stmt.where(Article.category_id == cat_id)
    return stmt


async def _resolve_category_id(db: AsyncSession, user_id: int, name: str | None) -> int | None:
    if not name:
        return None
    result = await db.execute(
        select(Category).where(Category.user_id == user_id, Category.name == name)
    )
    cat = result.scalar_one_or_none()
    return cat.id if cat else None


class ArticleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user: User, body: CreateArticleRequest) -> ArticleResponse:
        # Check duplicate
        dup = await self.db.execute(
            select(Article).where(Article.user_id == user.id, Article.url == body.url)
        )
        if dup.scalar_one_or_none() is not None:
            raise AppException(400, "BAD_REQUEST", "Article already saved")

        # Extract metadata
        meta = await extract_og_metadata(body.url)
        title = (meta["title"] or body.url)[:500]
        description = (body.description or DEFAULT_DESCRIPTION)[:1000]
        thumbnail_url = meta["image_url"]
        if thumbnail_url:
            thumbnail_url = thumbnail_url[:2048]

        domain = _extract_domain(body.url)
        now = datetime.datetime.now(datetime.timezone.utc)
        category_id = await _resolve_category_id(self.db, user.id, body.category)
        tags = _normalize_tags(body.tags)

        article = Article(
            public_id=uuid.uuid4(),
            user_id=user.id,
            url=body.url,
            title=title,
            description=description,
            thumbnail_url=thumbnail_url,
            domain=domain,
            tags=tags,
            category_id=category_id,
            is_read=False,
            created_at=now,
        )
        self.db.add(article)
        try:
            await self.db.commit()
            await self.db.refresh(article)
        except IntegrityError:
            await self.db.rollback()
            raise AppException(400, "BAD_REQUEST", "Article already saved")

        return _to_response(article)

    async def list_articles(
        self,
        user: User,
        is_read: bool | None,
        sort: str | None,
        query: str | None,
        search_field: str | None,
        category: str | None,
        domain: str | None,
        cursor: str | None,
        size: int,
    ) -> ArticleCursorResponse:
        size = min(size, 50)

        stmt = select(Article).where(Article.user_id == user.id)
        if is_read is not None:
            stmt = stmt.where(Article.is_read == is_read)
        if query:
            if search_field == "url":
                stmt = stmt.where(func.lower(Article.url).contains(query.lower()))
            elif search_field == "tag":
                tag = query.strip().lstrip("#").lower()
                if tag:
                    # NOTE: Avoid `unnest()` column naming pitfalls across SQLAlchemy/asyncpg.
                    # For v1 search, treat tags as a concatenated string and run case-insensitive substring match.
                    stmt = stmt.where(func.lower(func.array_to_string(Article.tags, " ")).contains(tag))
            else:
                stmt = stmt.where(func.lower(Article.title).contains(query.lower()))
        if category:
            cat_id = await _resolve_category_id(self.db, user.id, category)
            stmt = stmt.where(Article.category_id == cat_id)
        if domain:
            stmt = stmt.where(Article.domain == domain)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = (await self.db.execute(count_stmt)).scalar_one()

        if cursor is not None:
            cursor_id = int(cursor)
            if sort == "oldest":
                stmt = stmt.where(Article.id > cursor_id)
            else:
                stmt = stmt.where(Article.id < cursor_id)

        order = asc(Article.id) if sort == "oldest" else desc(Article.id)
        stmt = stmt.order_by(order).limit(size + 1)
        rows = list((await self.db.execute(stmt)).scalars().all())

        has_next = len(rows) > size
        items = rows[:size]
        next_cursor = str(items[-1].id) if has_next and items else None

        return ArticleCursorResponse(
            items=[_to_response(a) for a in items],
            nextCursor=next_cursor,
            hasNext=has_next,
            totalItems=total,
        )

    async def update(self, user: User, article_id: int, body: UpdateArticleRequest) -> ArticleResponse:
        result = await self.db.execute(
            select(Article).where(Article.id == article_id, Article.user_id == user.id)
        )
        article = result.scalar_one_or_none()
        if article is None:
            raise AppException(404, "NOT_FOUND", "Article not found")

        if body.isRead is not None:
            article.is_read = body.isRead
        if body.category is not None:
            article.category_id = await _resolve_category_id(self.db, user.id, body.category)
        if body.description is not None:
            article.description = body.description[:1000]

        await self.db.commit()
        await self.db.refresh(article)
        return _to_response(article)

    async def update_tags(self, user: User, article_id: int, tags: list[str]) -> ArticleResponse:
        result = await self.db.execute(
            select(Article).where(Article.id == article_id, Article.user_id == user.id)
        )
        article = result.scalar_one_or_none()
        if article is None:
            raise AppException(404, "NOT_FOUND", "Article not found")

        article.tags = _normalize_tags(tags)
        await self.db.commit()
        await self.db.refresh(article)
        return _to_response(article)

    async def bulk_update(self, user: User, body: BulkUpdateRequest) -> BulkActionResponse:
        stmt = select(Article).where(Article.user_id == user.id)

        if body.selectAll:
            stmt = await _apply_bulk_filters(self.db, stmt, user.id, body.filters)
        else:
            if not body.ids:
                return BulkActionResponse(affected=0)
            stmt = stmt.where(Article.id.in_(body.ids))

        rows = list((await self.db.execute(stmt)).scalars().all())

        for article in rows:
            if body.isRead is not None:
                article.is_read = body.isRead
            if body.category is not None:
                article.category_id = await _resolve_category_id(self.db, user.id, body.category or None)

        await self.db.commit()
        return BulkActionResponse(affected=len(rows))

    async def bulk_delete(self, user: User, body: BulkDeleteRequest) -> BulkActionResponse:
        stmt = select(Article).where(Article.user_id == user.id)

        if body.selectAll:
            stmt = await _apply_bulk_filters(self.db, stmt, user.id, body.filters)
        else:
            if not body.ids:
                return BulkActionResponse(affected=0)
            stmt = stmt.where(Article.id.in_(body.ids))

        rows = list((await self.db.execute(stmt)).scalars().all())

        for article in rows:
            await self.db.delete(article)
        await self.db.commit()
        return BulkActionResponse(affected=len(rows))

    async def delete(self, user: User, article_id: int) -> None:
        result = await self.db.execute(
            select(Article).where(Article.id == article_id, Article.user_id == user.id)
        )
        article = result.scalar_one_or_none()
        if article is None:
            raise AppException(404, "NOT_FOUND", "Article not found")
        await self.db.delete(article)
        await self.db.commit()

    async def migrate(self, user: User, body: ArticleMigrationRequest) -> ArticleMigrationResponse:
        total = len(body.items)
        created = duplicates = failed = 0
        now = datetime.datetime.now(datetime.timezone.utc)

        for item in body.items:
            try:
                dup = await self.db.execute(
                    select(Article).where(Article.user_id == user.id, Article.url == item.url)
                )
                if dup.scalar_one_or_none() is not None:
                    duplicates += 1
                    continue

                domain = item.domain or _extract_domain(item.url)
                title = (item.title or item.url)[:500]
                description = item.description or DEFAULT_DESCRIPTION
                description = description[:1000]
                thumbnail_url = item.thumbnailUrl
                if thumbnail_url:
                    thumbnail_url = thumbnail_url[:2048]

                category_id = await _resolve_category_id(self.db, user.id, item.category)

                article = Article(
                    public_id=uuid.uuid4(),
                    user_id=user.id,
                    url=item.url,
                    title=title,
                    description=description,
                    thumbnail_url=thumbnail_url,
                    domain=domain[:255],
                    category_id=category_id,
                    is_read=item.isRead or False,
                    created_at=now,
                )
                self.db.add(article)
                await self.db.flush()
                created += 1
            except IntegrityError:
                await self.db.rollback()
                duplicates += 1
            except Exception:
                await self.db.rollback()
                failed += 1

        await self.db.commit()
        return ArticleMigrationResponse(
            total=total,
            created=created,
            duplicates=duplicates,
            failed=failed,
        )
