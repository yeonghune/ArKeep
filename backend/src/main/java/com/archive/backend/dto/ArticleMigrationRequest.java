package com.archive.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ArticleMigrationRequest(
        @NotNull(message = "items is required") @Valid List<ArticleMigrationItemRequest> items
) {
}
