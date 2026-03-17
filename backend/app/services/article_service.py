"""
Article service — CRUD, pagination, facets, migration.
Mirrors Java ArticleService exactly (1-based pages, search on title, etc.).
"""

import datetime
import math
import uuid
from urllib.parse import urlparse

from sqlalchemy import asc, desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.article import Article
from app.models.user import User
from app.schemas.article import (
    ArticleFacetsResponse,
    ArticleMigrationRequest,
    ArticleMigrationResponse,
    ArticlePageResponse,
    ArticleResponse,
    CreateArticleRequest,
    MigrationItem,
    UpdateArticleRequest,
)
from app.services.auth_service import AppException
from app.services.og_extractor import extract_og_metadata

DEFAULT_DESCRIPTION = "Saved for later"
MAX_PAGE_SIZE = 8


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
        category=article.category,
        isRead=article.is_read,
        createdAt=article.created_at,
    )


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
        description = body.description or meta["description"] or DEFAULT_DESCRIPTION
        description = description[:1000]
        thumbnail_url = meta["image_url"]
        if thumbnail_url:
            thumbnail_url = thumbnail_url[:2048]

        domain = _extract_domain(body.url)
        now = datetime.datetime.now(datetime.timezone.utc)

        article = Article(
            public_id=uuid.uuid4(),
            user_id=user.id,
            url=body.url,
            title=title,
            description=description,
            thumbnail_url=thumbnail_url,
            domain=domain,
            category=body.category,
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
        category: str | None,
        domain: str | None,
        page: int,
        size: int,
    ) -> ArticlePageResponse:
        size = min(size, MAX_PAGE_SIZE)
        page = max(page, 1)

        stmt = select(Article).where(Article.user_id == user.id)
        if is_read is not None:
            stmt = stmt.where(Article.is_read == is_read)
        if query:
            stmt = stmt.where(func.lower(Article.title).contains(query.lower()))
        if category:
            stmt = stmt.where(Article.category == category)
        if domain:
            stmt = stmt.where(Article.domain == domain)

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = (await self.db.execute(count_stmt)).scalar_one()

        total_pages = math.ceil(total / size) if total > 0 else 0

        order = asc(Article.created_at) if sort == "oldest" else desc(Article.created_at)
        stmt = stmt.order_by(order).offset((page - 1) * size).limit(size)
        rows = (await self.db.execute(stmt)).scalars().all()

        return ArticlePageResponse(
            items=[_to_response(a) for a in rows],
            page=page,
            size=size,
            totalItems=total,
            totalPages=total_pages,
            hasNext=page < total_pages,
            hasPrevious=page > 1,
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
            article.category = body.category
        if body.description is not None:
            article.description = body.description[:1000]

        await self.db.commit()
        await self.db.refresh(article)
        return _to_response(article)

    async def delete(self, user: User, article_id: int) -> None:
        result = await self.db.execute(
            select(Article).where(Article.id == article_id, Article.user_id == user.id)
        )
        article = result.scalar_one_or_none()
        if article is None:
            raise AppException(404, "NOT_FOUND", "Article not found")
        await self.db.delete(article)
        await self.db.commit()

    async def facets(self, user: User) -> ArticleFacetsResponse:
        cat_stmt = (
            select(Article.category)
            .where(
                Article.user_id == user.id,
                Article.category.isnot(None),
                Article.category != "",
            )
            .distinct()
            .order_by(asc(Article.category))
        )
        dom_stmt = (
            select(Article.domain)
            .where(Article.user_id == user.id)
            .distinct()
            .order_by(asc(Article.domain))
        )
        categories = list((await self.db.execute(cat_stmt)).scalars().all())
        domains = list((await self.db.execute(dom_stmt)).scalars().all())
        return ArticleFacetsResponse(categories=categories, domains=domains)

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

                article = Article(
                    public_id=uuid.uuid4(),
                    user_id=user.id,
                    url=item.url,
                    title=title,
                    description=description,
                    thumbnail_url=thumbnail_url,
                    domain=domain[:255],
                    category=item.category,
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
