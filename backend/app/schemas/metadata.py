from typing import Optional

from pydantic import BaseModel, field_validator


class MetadataPreviewRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def url_must_be_http(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class MetadataPreviewResponse(BaseModel):
    url: str
    title: Optional[str]
    description: Optional[str]
    imageUrl: Optional[str]
    domain: str
