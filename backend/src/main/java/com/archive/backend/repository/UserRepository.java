package com.archive.backend.repository;

import com.archive.backend.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByProviderAndProviderUserId(String provider, String providerUserId);

    default Optional<User> findByEmail(String email) {
        return findByProviderAndProviderUserId("GOOGLE", email);
    }

    default boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }
}
