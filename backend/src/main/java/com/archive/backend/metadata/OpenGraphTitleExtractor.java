package com.archive.backend.metadata;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class OpenGraphTitleExtractor implements TitleExtractor {

    private static final Logger log = LoggerFactory.getLogger(OpenGraphTitleExtractor.class);

    @Override
    public OgMetadata extract(String rawUrl) {
        try {
            Connection.Response response = Jsoup.connect(rawUrl)
                    .userAgent("Mozilla/5.0")
                    .referrer("https://www.google.com")
                    .followRedirects(true)
                    .timeout(5000)
                    .execute();
            Document document = response.parse();

            String title = readMeta(document, "og:title");
            if (title == null) {
                title = readDocumentTitle(document);
            }
            if (title == null) {
                title = readFirstHeading(document);
            }
            String description = readMeta(document, "og:description");
            String imageUrl = readMeta(document, "og:image");

            log.info("OG extract url={} status={} title={} descriptionPresent={} imagePresent={}",
                    rawUrl,
                    response.statusCode(),
                    title,
                    description != null,
                    imageUrl != null);

            return new OgMetadata(title, description, imageUrl);
        } catch (Exception ex) {
            log.warn("OG extract failed url={} message={}", rawUrl, ex.getMessage());
            return OgMetadata.empty();
        }
    }

    private String readMeta(Document document, String property) {
        Element element = document.selectFirst("meta[property='" + property + "']");
        if (element == null) {
            return null;
        }

        String content = element.attr("content");
        if (content == null) {
            return null;
        }

        String normalized = content.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String readDocumentTitle(Document document) {
        String title = document.title();
        if (title == null) {
            return null;
        }
        String normalized = title.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String readFirstHeading(Document document) {
        Element heading = document.selectFirst("h1");
        if (heading == null) {
            return null;
        }
        String text = heading.text();
        if (text == null) {
            return null;
        }
        String normalized = text.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
