package com.archive.backend.metadata;

public record OgMetadata(String title, String description, String imageUrl) {
    public static OgMetadata empty() {
        return new OgMetadata(null, null, null);
    }
}
