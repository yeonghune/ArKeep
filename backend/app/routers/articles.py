from typing import Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.article import (
    ArticleFacetsResponse,
    ArticleMigrationRequest,
    ArticleMigrationResponse,
    ArticlePageResponse,
    ArticleResponse,
    CreateArticleRequest,
    UpdateArticleRequest,
)
from app.services.article_service import ArticleService

router = APIRouter(prefix="/articles", tags=["articles"])


@router.post("", status_code=201, response_model=ArticleResponse)
async def create_article(
    body: CreateArticleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticleResponse:
    return await ArticleService(db).create(current_user, body)


@router.get("", response_model=ArticlePageResponse)
async def list_articles(
    isRead: Optional[bool] = Query(None),
    sort: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(8, ge=1, le=8),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticlePageResponse:
    return await ArticleService(db).list_articles(
        user=current_user,
        is_read=isRead,
        sort=sort,
        query=q,
        category=category,
        domain=domain,
        page=page,
        size=size,
    )


# IMPORTANT: /facets must be declared before /{id} to prevent route conflict
@router.get("/facets", response_model=ArticleFacetsResponse)
async def get_facets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticleFacetsResponse:
    return await ArticleService(db).facets(current_user)


@router.patch("/{id}", response_model=ArticleResponse)
async def update_article(
    body: UpdateArticleRequest,
    id: int = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticleResponse:
    return await ArticleService(db).update(current_user, id, body)


@router.delete("/{id}", status_code=204)
async def delete_article(
    id: int = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await ArticleService(db).delete(current_user, id)


@router.post("/migrate", response_model=ArticleMigrationResponse)
async def migrate_articles(
    body: ArticleMigrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticleMigrationResponse:
    return await ArticleService(db).migrate(current_user, body)
