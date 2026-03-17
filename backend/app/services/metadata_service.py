from urllib.parse import urlparse

from app.schemas.metadata import MetadataPreviewResponse
from app.services.og_extractor import extract_og_metadata


def _extract_domain(url: str) -> str:
    try:
        hostname = urlparse(url).hostname or ""
        return hostname.lower() or "unknown"
    except Exception:
        return "unknown"


async def preview_metadata(url: str) -> MetadataPreviewResponse:
    meta = await extract_og_metadata(url)
    return MetadataPreviewResponse(
        url=url,
        title=meta["title"],
        description=meta["description"],
        imageUrl=meta["image_url"],
        domain=_extract_domain(url),
    )
