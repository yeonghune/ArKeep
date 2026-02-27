package com.archive.backend.metadata;

public interface TitleExtractor {
    OgMetadata extract(String rawUrl);
}
