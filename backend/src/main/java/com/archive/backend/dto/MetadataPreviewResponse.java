package com.archive.backend.dto;

public record MetadataPreviewResponse(
        String url,
        String title,
        String description,
        String imageUrl,
        String domain
) {
}
