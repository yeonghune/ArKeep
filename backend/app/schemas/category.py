from pydantic import BaseModel, field_validator


class UpdateCategoryRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("카테고리 이름은 비워둘 수 없습니다.")
        if len(v) > 100:
            raise ValueError("카테고리 이름은 100자를 초과할 수 없습니다.")
        return v


class CreateCategoryRequest(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("카테고리 이름은 비워둘 수 없습니다.")
        if len(v) > 100:
            raise ValueError("카테고리 이름은 100자를 초과할 수 없습니다.")
        return v


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class CategoryListResponse(BaseModel):
    categories: list[CategoryResponse]
