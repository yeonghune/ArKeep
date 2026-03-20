import re

from pydantic import BaseModel, field_validator

RESERVED_NAMES = {"모든 카테고리"}
ALLOWED_PATTERN = re.compile(r"^[가-힣ㄱ-ㅎㅏ-ㅣ0-9 ]+$")
MAX_LENGTH = 15


def validate_category_name(v: str) -> str:
    v = re.sub(r" {2,}", " ", v).strip()
    if not v:
        raise ValueError("카테고리 이름은 비워둘 수 없습니다.")
    if v in RESERVED_NAMES:
        raise ValueError(f'"{v}"는 예약어이므로 사용할 수 없습니다.')
    if len(v) > MAX_LENGTH:
        raise ValueError(f"카테고리 이름은 {MAX_LENGTH}자를 초과할 수 없습니다.")
    if not ALLOWED_PATTERN.match(v):
        raise ValueError("카테고리 이름은 한글, 숫자, 띄어쓰기만 사용할 수 있습니다.")
    return v


class CreateCategoryRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_category_name(v)


class UpdateCategoryRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_category_name(v)


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class CategoryListResponse(BaseModel):
    categories: list[CategoryResponse]
