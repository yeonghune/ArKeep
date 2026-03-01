package com.archive.backend.controller;

import com.archive.backend.dto.ArticleFacetsResponse;
import com.archive.backend.dto.ArticleMigrationRequest;
import com.archive.backend.dto.ArticleMigrationResponse;
import com.archive.backend.dto.ArticlePageResponse;
import com.archive.backend.dto.ArticleResponse;
import com.archive.backend.dto.CreateArticleRequest;
import com.archive.backend.dto.UpdateArticleRequest;
import com.archive.backend.exception.UnauthorizedException;
import com.archive.backend.service.ArticleService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ArticleResponse create(Principal principal, @Valid @RequestBody CreateArticleRequest request) {
        return articleService.create(resolveUserId(principal), request);
    }

    @GetMapping
    public ArticlePageResponse list(Principal principal,
                                    @RequestParam(required = false) Boolean isRead,
                                    @RequestParam(required = false) String sort,
                                    @RequestParam(required = false, name = "q") String query,
                                    @RequestParam(required = false) String category,
                                    @RequestParam(required = false) String domain,
                                    @RequestParam(defaultValue = "1") Integer page,
                                    @RequestParam(defaultValue = "8") Integer size) {
        return articleService.list(resolveUserId(principal), isRead, sort, query, category, domain, page, size);
    }

    @GetMapping("/facets")
    public ArticleFacetsResponse facets(Principal principal) {
        return articleService.facets(resolveUserId(principal));
    }

    @PatchMapping("/{id}")
    public ArticleResponse patch(Principal principal,
                                 @PathVariable Long id,
                                 @Valid @RequestBody UpdateArticleRequest request) {
        return articleService.update(resolveUserId(principal), id, request);
    }

    @PostMapping("/migrate")
    public ArticleMigrationResponse migrate(Principal principal, @Valid @RequestBody ArticleMigrationRequest request) {
        return articleService.migrate(resolveUserId(principal), request.items());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Principal principal, @PathVariable Long id) {
        articleService.delete(resolveUserId(principal), id);
        return ResponseEntity.noContent().build();
    }

    private String resolveUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new UnauthorizedException("Authentication required");
        }
        return principal.getName();
    }
}
