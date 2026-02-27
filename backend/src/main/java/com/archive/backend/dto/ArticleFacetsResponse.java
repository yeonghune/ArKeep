package com.archive.backend.dto;

import java.util.List;

public record ArticleFacetsResponse(
        List<String> categories,
        List<String> domains
) {}
