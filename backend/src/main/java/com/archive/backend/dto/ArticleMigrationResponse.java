package com.archive.backend.dto;

public record ArticleMigrationResponse(
        int total,
        int created,
        int duplicates,
        int failed
) {
}
