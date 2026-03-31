import datetime
import re
import uuid
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator

TAG_ALLOWED = re.compile(r"^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$")


class CreateArticleRequest(BaseModel):
    url: str
    category: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        if len(v) > 5:
            raise ValueError("Tags must be at most 5")
        seen: set[str] = set()
        for tag in v:
            stripped = tag.strip()
            if len(stripped) > 20:
                raise ValueError("Each tag must be at most 20 characters")
            if not TAG_ALLOWED.match(stripped):
                raise ValueError("Tags may only contain Korean, English letters, and numbers")
            if stripped in seen:
                raise ValueError(f"Duplicate tag: {stripped}")
            seen.add(stripped)
        return v

    @field_validator("url")
    @classmethod
    def url_must_be_http(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    @field_validator("category")
    @classmethod
    def category_max(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 100:
            raise ValueError("Category must be at most 100 characters")
        return v

    @field_validator("description")
    @classmethod
    def description_max(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 1000:
            raise ValueError("Description must be at most 1000 characters")
        return v


class UpdateArticleRequest(BaseModel):
    isRead: Optional[bool] = None
    category: Optional[str] = None
    description: Optional[str] = None

    @model_validator(mode="after")
    def at_least_one_field(self) -> "UpdateArticleRequest":
        if self.isRead is None and self.category is None and self.description is None:
            raise ValueError("At least one field is required: isRead, category or description")
        return self

    @field_validator("category")
    @classmethod
    def category_max(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 100:
            raise ValueError("Category must be at most 100 characters")
        return v

    @field_validator("description")
    @classmethod
    def description_max(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 1000:
            raise ValueError("Description must be at most 1000 characters")
        return v


class ArticleResponse(BaseModel):
    id: int
    publicId: uuid.UUID
    url: str
    title: str
    description: Optional[str]
    thumbnailUrl: Optional[str]
    domain: str
    category: Optional[str]
    isRead: bool
    tags: list[str] = []
    createdAt: datetime.datetime

    model_config = {"from_attributes": True}


class ArticleCursorResponse(BaseModel):
    items: list[ArticleResponse]
    nextCursor: str | None
    hasNext: bool
    totalItems: int



class BulkFilter(BaseModel):
    isRead: Optional[bool] = None
    category: Optional[str] = None
    q: Optional[str] = None
    searchField: Optional[str] = None


class BulkUpdateRequest(BaseModel):
    ids: list[int] = []
    selectAll: bool = False
    filters: Optional[BulkFilter] = None
    isRead: Optional[bool] = None
    category: Optional[str] = None


class BulkDeleteRequest(BaseModel):
    ids: list[int] = []
    selectAll: bool = False
    filters: Optional[BulkFilter] = None


class BulkActionResponse(BaseModel):
    affected: int


class UpdateArticleTagsRequest(BaseModel):
    tags: list[str]

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        if len(v) > 5:
            raise ValueError("Tags must be at most 5")
        seen: set[str] = set()
        for tag in v:
            stripped = tag.strip()
            if len(stripped) > 20:
                raise ValueError("Each tag must be at most 20 characters")
            if not TAG_ALLOWED.match(stripped):
                raise ValueError("Tags may only contain Korean, English letters, and numbers")
            if stripped in seen:
                raise ValueError(f"Duplicate tag: {stripped}")
            seen.add(stripped)
        return v



class MigrationItem(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnailUrl: Optional[str] = None
    domain: Optional[str] = None
    category: Optional[str] = None
    isRead: Optional[bool] = None

    @field_validator("url")
    @classmethod
    def url_must_be_http(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class ArticleMigrationRequest(BaseModel):
    items: list[MigrationItem]


class ArticleMigrationResponse(BaseModel):
    total: int
    created: int
    duplicates: int
    failed: int
