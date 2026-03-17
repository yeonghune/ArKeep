from fastapi import APIRouter

from app.schemas.metadata import MetadataPreviewRequest, MetadataPreviewResponse
from app.services.metadata_service import preview_metadata

router = APIRouter(prefix="/metadata", tags=["metadata"])


@router.post("/preview", response_model=MetadataPreviewResponse)
async def metadata_preview(body: MetadataPreviewRequest) -> MetadataPreviewResponse:
    return await preview_metadata(body.url)
