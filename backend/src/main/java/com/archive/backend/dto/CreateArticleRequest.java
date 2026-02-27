package com.archive.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateArticleRequest(
        @NotBlank @Pattern(regexp = "https?://.+", message = "URL must start with http:// or https://") String url,
        @Size(max = 100, message = "Category must be at most 100 characters") String category,
        @Size(max = 1000, message = "Description must be at most 1000 characters") String description
) {}
