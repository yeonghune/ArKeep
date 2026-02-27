package com.archive.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record ArticleResponse(
        Long id,
        UUID publicId,
        String url,
        String title,
        String description,
        String thumbnailUrl,
        String domain,
        String category,
        Boolean isRead,
        Instant createdAt
) {}
