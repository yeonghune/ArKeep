package com.archive.backend.metadata;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@Primary
public class OpenGraphTitleExtractor implements TitleExtractor {

    private static final Logger log = LoggerFactory.getLogger(OpenGraphTitleExtractor.class);
    private static final int MAX_IFRAME_DEPTH = 2;
    private static final int MAX_IFRAMES_PER_DOCUMENT = 5;

    @Override
    public OgMetadata extract(String rawUrl) {
        try {
            Connection.Response response = connect(rawUrl).execute();
            Document document = response.parse();

            String title = readMeta(document, "og:title");
            boolean rootHasOgTitle = title != null;
            String description = readMeta(document, "og:description");
            String imageUrl = readMetaUrl(document, "og:image");
            if (title == null) {
                title = readDocumentTitle(document);
            }
            if (title == null) {
                title = readFirstHeading(document);
            }

            if (title == null || description == null || imageUrl == null) {
                OgMetadata iframeMetadata = readFromIframes(document, new HashSet<>(), 0);
                if ((!rootHasOgTitle && iframeMetadata.title() != null) || title == null) {
                    title = iframeMetadata.title();
                }
                if (description == null) {
                    description = iframeMetadata.description();
                }
                if (imageUrl == null) {
                    imageUrl = iframeMetadata.imageUrl();
                }
            }

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

    private Connection connect(String url) {
        return Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .referrer("https://www.google.com")
                .followRedirects(true)
                .timeout(5000);
    }

    private OgMetadata readFromIframes(Document document, Set<String> visitedUrls, int depth) {
        if (depth >= MAX_IFRAME_DEPTH) {
            return OgMetadata.empty();
        }

        String title = null;
        String description = null;
        String imageUrl = null;
        int scanned = 0;

        for (Element iframe : document.select("body iframe[src]")) {
            if (scanned >= MAX_IFRAMES_PER_DOCUMENT) {
                break;
            }
            scanned++;

            String iframeUrl = iframe.absUrl("src");
            if (iframeUrl == null || iframeUrl.isBlank() || !visitedUrls.add(iframeUrl)) {
                continue;
            }

            try {
                Document iframeDoc = connect(iframeUrl).get();

                if (title == null) {
                    title = readMeta(iframeDoc, "og:title");
                    if (title == null) {
                        title = readDocumentTitle(iframeDoc);
                    }
                    if (title == null) {
                        title = readFirstHeading(iframeDoc);
                    }
                }
                if (description == null) {
                    description = readMeta(iframeDoc, "og:description");
                }
                if (imageUrl == null) {
                    imageUrl = readMetaUrl(iframeDoc, "og:image");
                }

                if (title != null && description != null && imageUrl != null) {
                    break;
                }

                OgMetadata nested = readFromIframes(iframeDoc, visitedUrls, depth + 1);
                if (title == null) {
                    title = nested.title();
                }
                if (description == null) {
                    description = nested.description();
                }
                if (imageUrl == null) {
                    imageUrl = nested.imageUrl();
                }

                if (title != null && description != null && imageUrl != null) {
                    break;
                }
            } catch (Exception ex) {
                log.debug("iframe extract failed parent={} iframe={} message={}",
                        document.location(),
                        iframeUrl,
                        ex.getMessage());
            }
        }

        return new OgMetadata(title, description, imageUrl);
    }

    private String readMetaUrl(Document document, String property) {
        Element element = document.selectFirst("meta[property='" + property + "']");
        if (element == null) return null;
        String abs = element.absUrl("content");
        if (!abs.isBlank()) return abs;
        String raw = element.attr("content").trim();
        return raw.isBlank() ? null : raw;
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
