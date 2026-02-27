package com.archive.backend.service;

import com.archive.backend.dto.MetadataPreviewResponse;
import com.archive.backend.metadata.OgMetadata;
import com.archive.backend.metadata.TitleExtractor;
import java.net.URI;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class MetadataService {

    private static final String DEFAULT_DESCRIPTION = "Saved for later";
    private static final int TITLE_MAX_LENGTH = 500;
    private static final int DESCRIPTION_MAX_LENGTH = 1000;
    private static final int IMAGE_MAX_LENGTH = 2048;

    private final TitleExtractor titleExtractor;

    public MetadataService(TitleExtractor titleExtractor) {
        this.titleExtractor = titleExtractor;
    }

    public MetadataPreviewResponse preview(String rawUrl) {
        String normalizedUrl = rawUrl.trim();
        OgMetadata metadata = titleExtractor.extract(normalizedUrl);

        String title = metadata == null ? null : metadata.title();
        if (title == null || title.isBlank()) {
            title = normalizedUrl;
        } else {
            title = title.trim();
        }

        String description = metadata == null ? null : metadata.description();
        if (description == null || description.isBlank()) {
            description = DEFAULT_DESCRIPTION;
        } else {
            description = description.trim();
        }

        String imageUrl = metadata == null ? null : metadata.imageUrl();
        if (imageUrl != null) {
            imageUrl = imageUrl.trim();
            if (imageUrl.isBlank()) {
                imageUrl = null;
            }
        }

        return new MetadataPreviewResponse(
                normalizedUrl,
                truncate(title, TITLE_MAX_LENGTH),
                truncate(description, DESCRIPTION_MAX_LENGTH),
                imageUrl == null ? null : truncate(imageUrl, IMAGE_MAX_LENGTH),
                extractDomain(normalizedUrl)
        );
    }

    private String extractDomain(String rawUrl) {
        try {
            URI uri = URI.create(rawUrl);
            String host = uri.getHost();
            return host == null ? "unknown" : host.toLowerCase(Locale.ROOT);
        } catch (Exception ex) {
            return "unknown";
        }
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
