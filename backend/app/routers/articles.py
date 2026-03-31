from typing import Optional

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.article import (
    ArticleCursorResponse,
    ArticleMigrationRequest,
    ArticleMigrationResponse,
    ArticleResponse,
    BulkActionResponse,
    BulkDeleteRequest,
    BulkUpdateRequest,
    CreateArticleRequest,
    UpdateArticleRequest,
    UpdateArticleTagsRequest,
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


@router.get("", response_model=ArticleCursorResponse)
async def list_articles(
    isRead: Optional[bool] = Query(None),
    sort: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    searchField: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    cursor: Optional[str] = Query(None),
    size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticleCursorResponse:
    return await ArticleService(db).list_articles(
        user=current_user,
        is_read=isRead,
        sort=sort,
        query=q,
        search_field=searchField,
        category=category,
        domain=domain,
        cursor=cursor,
        size=size,
    )



# IMPORTANT: /bulk must be declared before /{id} to prevent route conflict
@router.patch("/bulk", response_model=BulkActionResponse)
async def bulk_update_articles(
    body: BulkUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BulkActionResponse:
    return await ArticleService(db).bulk_update(current_user, body)


@router.delete("/bulk", response_model=BulkActionResponse)
async def bulk_delete_articles(
    body: BulkDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BulkActionResponse:
    return await ArticleService(db).bulk_delete(current_user, body)


@router.patch("/{id}", response_model=ArticleResponse)
async def update_article(
    body: UpdateArticleRequest,
    id: int = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticleResponse:
    return await ArticleService(db).update(current_user, id, body)


@router.patch("/{id}/tags", response_model=ArticleResponse)
async def update_article_tags(
    body: UpdateArticleTagsRequest,
    id: int = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ArticleResponse:
    return await ArticleService(db).update_tags(current_user, id, body.tags)


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
