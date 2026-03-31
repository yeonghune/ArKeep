from fastapi import APIRouter, Request

from app.rate_limiter import limiter
from app.schemas.metadata import MetadataPreviewRequest, MetadataPreviewResponse
from app.services.metadata_service import preview_metadata

router = APIRouter(prefix="/metadata", tags=["metadata"])


@router.post("/preview", response_model=MetadataPreviewResponse)
@limiter.limit("30/minute")
async def metadata_preview(request: Request, body: MetadataPreviewRequest) -> MetadataPreviewResponse:
    return await preview_metadata(body.url)
