package com.archive.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ArticleMigrationItemRequest(
        @NotBlank @Pattern(regexp = "https?://.+", message = "URL must start with http:// or https://") String url,
        @Size(max = 500, message = "Title must be at most 500 characters") String title,
        @Size(max = 1000, message = "Description must be at most 1000 characters") String description,
        @Size(max = 2048, message = "thumbnailUrl must be at most 2048 characters") String thumbnailUrl,
        @Size(max = 255, message = "Domain must be at most 255 characters") String domain,
        @Size(max = 100, message = "Category must be at most 100 characters") String category,
        Boolean isRead
) {
}
