package com.archive.backend.service;

import com.archive.backend.domain.Article;
import com.archive.backend.domain.User;
import com.archive.backend.dto.ArticleFacetsResponse;
import com.archive.backend.dto.ArticleMigrationItemRequest;
import com.archive.backend.dto.ArticleMigrationResponse;
import com.archive.backend.dto.ArticlePageResponse;
import com.archive.backend.dto.ArticleResponse;
import com.archive.backend.dto.CreateArticleRequest;
import com.archive.backend.dto.UpdateArticleRequest;
import com.archive.backend.exception.BadRequestException;
import com.archive.backend.exception.ConflictException;
import com.archive.backend.exception.NotFoundException;
import com.archive.backend.metadata.OgMetadata;
import com.archive.backend.metadata.TitleExtractor;
import com.archive.backend.repository.ArticleRepository;
import com.archive.backend.repository.UserRepository;
import java.net.URI;
import java.util.Collections;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArticleService {

    private static final String PROVIDER = "GOOGLE";
    private static final String DEFAULT_DESCRIPTION = "Saved for later";
    private static final int TITLE_MAX_LENGTH = 500;
    private static final int DESCRIPTION_MAX_LENGTH = 1000;
    private static final int THUMBNAIL_MAX_LENGTH = 2048;
    private static final int CATEGORY_MAX_LENGTH = 100;
    private static final int DEFAULT_PAGE_SIZE = 8;
    private static final int MAX_PAGE_SIZE = 8;
    private static final String SORT_LATEST = "latest";
    private static final String SORT_OLDEST = "oldest";

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final TitleExtractor titleExtractor;

    public ArticleService(ArticleRepository articleRepository,
                          UserRepository userRepository,
                          TitleExtractor titleExtractor) {
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
        this.titleExtractor = titleExtractor;
    }

    @Transactional
    public ArticleResponse create(String userId, CreateArticleRequest request) {
        User user = getOrCreateUser(userId);
        String normalizedUrl = normalizeUrl(request.url());

        if (articleRepository.existsByUserAndUrl(user, normalizedUrl)) {
            throw new ConflictException("Article already saved");
        }

        OgMetadata metadata = titleExtractor.extract(normalizedUrl);

        Article article = new Article();
        article.setUser(user);
        article.setUrl(normalizedUrl);
        article.setTitle(extractSafeTitle(metadata, normalizedUrl));
        article.setDescription(resolveCreateDescription(request.description(), metadata));
        article.setThumbnailUrl(extractSafeThumbnailUrl(metadata));
        article.setDomain(extractDomain(normalizedUrl));
        article.setCategory(normalizeCategory(request.category()));
        article.setIsRead(false);

        try {
            Article saved = articleRepository.save(article);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Article already saved");
        }
    }

    @Transactional(readOnly = true)
    public ArticlePageResponse list(String userId,
                                    Boolean isRead,
                                    String sort,
                                    String query,
                                    String category,
                                    String domain,
                                    Integer page,
                                    Integer size) {
        User user = getOrCreateUser(userId);
        int pageNumber = resolvePage(page);
        int pageSize = resolvePageSize(size);
        Sort sortOption = resolveSort(sort);
        Pageable pageable = PageRequest.of(pageNumber - 1, pageSize, sortOption);
        String normalizedQuery = normalizeSearchQuery(query);
        String normalizedCategory = normalizeCategoryFilter(category);
        String normalizedDomain = normalizeDomainFilter(domain);
        Specification<Article> spec = buildArticleListSpec(user, isRead, normalizedQuery, normalizedCategory, normalizedDomain);
        Page<Article> articlePage = articleRepository.findAll(spec, pageable);
        List<ArticleResponse> items = articlePage.getContent().stream().map(this::toResponse).toList();
        return new ArticlePageResponse(
                items,
                articlePage.getNumber() + 1,
                articlePage.getSize(),
                articlePage.getTotalElements(),
                articlePage.getTotalPages(),
                articlePage.hasNext(),
                articlePage.hasPrevious()
        );
    }

    @Transactional(readOnly = true)
    public ArticleFacetsResponse facets(String userId) {
        User user = getOrCreateUser(userId);
        List<String> categories = articleRepository.findDistinctCategoriesByUser(user);
        List<String> domains = articleRepository.findDistinctDomainsByUser(user);
        return new ArticleFacetsResponse(categories, domains);
    }

    @Transactional
    public ArticleResponse update(String userId, Long id, UpdateArticleRequest request) {
        User user = getOrCreateUser(userId);
        Article article = articleRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Article not found"));

        if (request.isRead() == null && request.category() == null && request.description() == null) {
            throw new BadRequestException("At least one field is required: isRead, category or description");
        }
        if (request.isRead() != null) {
            article.setIsRead(request.isRead());
        }
        if (request.category() != null) {
            article.setCategory(normalizeCategory(request.category()));
        }
        if (request.description() != null) {
            article.setDescription(normalizeDescription(request.description()));
        }

        return toResponse(article);
    }

    @Transactional
    public void delete(String userId, Long id) {
        User user = getOrCreateUser(userId);
        Article article = articleRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new NotFoundException("Article not found"));

        articleRepository.delete(article);
    }

    @Transactional
    public ArticleMigrationResponse migrate(String userId, List<ArticleMigrationItemRequest> items) {
        User user = getOrCreateUser(userId);
        List<ArticleMigrationItemRequest> source = items == null ? Collections.emptyList() : items;

        int created = 0;
        int duplicates = 0;
        int failed = 0;

        for (ArticleMigrationItemRequest item : source) {
            try {
                String normalizedUrl = normalizeUrl(item.url());
                if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
                    failed += 1;
                    continue;
                }

                if (articleRepository.existsByUserAndUrl(user, normalizedUrl)) {
                    duplicates += 1;
                    continue;
                }

                Article article = new Article();
                article.setUser(user);
                article.setUrl(normalizedUrl);
                article.setTitle(resolveMigrationTitle(item.title(), normalizedUrl));
                article.setDescription(resolveMigrationDescription(item.description()));
                article.setThumbnailUrl(resolveMigrationThumbnail(item.thumbnailUrl()));
                article.setDomain(resolveMigrationDomain(item.domain(), normalizedUrl));
                article.setCategory(normalizeCategory(item.category()));
                article.setIsRead(Boolean.TRUE.equals(item.isRead()));
                articleRepository.save(article);
                created += 1;
            } catch (DataIntegrityViolationException ex) {
                duplicates += 1;
            } catch (Exception ex) {
                failed += 1;
            }
        }

        return new ArticleMigrationResponse(source.size(), created, duplicates, failed);
    }

    private User getOrCreateUser(String userId) {
        return userRepository.findByProviderAndProviderUserId(PROVIDER, userId)
                .orElseGet(() -> {
                    User user = new User();
                    user.setProvider(PROVIDER);
                    user.setProviderUserId(userId);
                    user.setDisplayName(userId);
                    return userRepository.save(user);
                });
    }

    private String normalizeUrl(String rawUrl) {
        return rawUrl.trim();
    }

    private String extractSafeTitle(OgMetadata metadata, String fallbackUrl) {
        String title = metadata == null ? null : metadata.title();
        String fallback = (title == null || title.isBlank()) ? fallbackUrl : title.trim();
        return truncate(fallback, TITLE_MAX_LENGTH);
    }

    private String extractSafeDescription(OgMetadata metadata) {
        String description = metadata == null ? null : metadata.description();
        if (description == null || description.isBlank()) {
            return DEFAULT_DESCRIPTION;
        }
        return truncate(description.trim(), DESCRIPTION_MAX_LENGTH);
    }

    private String resolveCreateDescription(String description, OgMetadata metadata) {
        if (description == null || description.isBlank()) {
            return extractSafeDescription(metadata);
        }
        return truncate(description.trim(), DESCRIPTION_MAX_LENGTH);
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return DEFAULT_DESCRIPTION;
        }
        return truncate(description.trim(), DESCRIPTION_MAX_LENGTH);
    }

    private String extractSafeThumbnailUrl(OgMetadata metadata) {
        String imageUrl = metadata == null ? null : metadata.imageUrl();
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }
        return truncate(imageUrl.trim(), THUMBNAIL_MAX_LENGTH);
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private String resolveMigrationTitle(String title, String fallbackUrl) {
        if (title == null || title.isBlank()) {
            return truncate(fallbackUrl, TITLE_MAX_LENGTH);
        }
        return truncate(title.trim(), TITLE_MAX_LENGTH);
    }

    private String resolveMigrationDescription(String description) {
        if (description == null || description.isBlank()) {
            return DEFAULT_DESCRIPTION;
        }
        return truncate(description.trim(), DESCRIPTION_MAX_LENGTH);
    }

    private String resolveMigrationThumbnail(String thumbnailUrl) {
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            return null;
        }
        return truncate(thumbnailUrl.trim(), THUMBNAIL_MAX_LENGTH);
    }

    private String resolveMigrationDomain(String domain, String rawUrl) {
        if (domain != null && !domain.isBlank()) {
            return truncate(domain.trim().toLowerCase(Locale.ROOT), 255);
        }
        return extractDomain(rawUrl);
    }

    private String normalizeCategory(String rawCategory) {
        if (rawCategory == null) {
            return null;
        }
        String trimmed = rawCategory.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return truncate(trimmed, CATEGORY_MAX_LENGTH);
    }

    private Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank() || SORT_LATEST.equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        if (SORT_OLDEST.equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "createdAt");
        }
        throw new BadRequestException("sort must be 'latest' or 'oldest'");
    }

    private int resolvePage(Integer page) {
        if (page == null) {
            return 1;
        }
        if (page < 1) {
            throw new BadRequestException("page must be greater than or equal to 1");
        }
        return page;
    }

    private int resolvePageSize(Integer size) {
        if (size == null) {
            return DEFAULT_PAGE_SIZE;
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("size must be between 1 and 8");
        }
        return size;
    }

    private String normalizeSearchQuery(String query) {
        if (query == null) {
            return null;
        }
        String trimmed = query.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeCategoryFilter(String category) {
        if (category == null) {
            return null;
        }
        String trimmed = category.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeDomainFilter(String domain) {
        if (domain == null) {
            return null;
        }
        String trimmed = domain.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private Specification<Article> buildArticleListSpec(User user,
                                                        Boolean isRead,
                                                        String query,
                                                        String category,
                                                        String domain) {
        return (root, queryRoot, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user"), user));
            if (!Objects.isNull(isRead)) {
                predicates.add(cb.equal(root.get("isRead"), isRead));
            }
            if (!Objects.isNull(query)) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + query.toLowerCase(Locale.ROOT) + "%"));
            }
            if (!Objects.isNull(category)) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (!Objects.isNull(domain)) {
                predicates.add(cb.equal(root.get("domain"), domain));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String extractDomain(String rawUrl) {
        try {
            URI uri = URI.create(rawUrl);
            String host = uri.getHost();
            return host == null ? "unknown" : host.toLowerCase(Locale.ROOT);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private ArticleResponse toResponse(Article article) {
        return new ArticleResponse(
                article.getId(),
                article.getPublicId(),
                article.getUrl(),
                article.getTitle(),
                article.getDescription(),
                article.getThumbnailUrl(),
                article.getDomain(),
                article.getCategory(),
                article.getIsRead(),
                article.getCreatedAt()
        );
    }
}
