package com.archive.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MetadataPreviewRequest(
        @NotBlank @Pattern(regexp = "https?://.+", message = "URL must start with http:// or https://") String url
) {
}
