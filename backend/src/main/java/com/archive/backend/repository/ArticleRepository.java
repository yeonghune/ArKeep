package com.archive.backend.repository;

import com.archive.backend.domain.Article;
import com.archive.backend.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ArticleRepository extends JpaRepository<Article, Long>, JpaSpecificationExecutor<Article> {
    @Query("""
            select distinct a.category from Article a
            where a.user = :user
              and a.category is not null
              and a.category <> ''
            order by a.category asc
            """)
    List<String> findDistinctCategoriesByUser(@Param("user") User user);

    @Query("""
            select distinct a.domain from Article a
            where a.user = :user
            order by a.domain asc
            """)
    List<String> findDistinctDomainsByUser(@Param("user") User user);

    boolean existsByUserAndUrl(User user, String url);
    Optional<Article> findByIdAndUser(Long id, User user);
}
