package com.archive.backend.repository;

import com.archive.backend.domain.RefreshToken;
import com.archive.backend.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByJti(String jti);

    @Modifying
    @Query("""
            update RefreshToken r
            set r.revoked = true
            where r.user = :user
              and r.familyId = :familyId
              and r.revoked = false
            """)
    int revokeActiveByUserAndFamily(@Param("user") User user, @Param("familyId") String familyId);
}
