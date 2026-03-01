package com.archive.backend.dto;

import java.util.List;

public record ArticlePageResponse(
        List<ArticleResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {}
