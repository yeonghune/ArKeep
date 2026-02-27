package com.archive.backend.service;

import com.archive.backend.auth.GoogleTokenVerifier;
import com.archive.backend.auth.GoogleUserProfile;
import com.archive.backend.domain.RefreshToken;
import com.archive.backend.domain.User;
import com.archive.backend.dto.AuthResponse;
import com.archive.backend.dto.MyProfileResponse;
import com.archive.backend.exception.UnauthorizedException;
import com.archive.backend.repository.RefreshTokenRepository;
import com.archive.backend.repository.UserRepository;
import com.archive.backend.security.JwtService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String PROVIDER = "GOOGLE";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final long refreshTokenExpirationMs;

    public AuthService(UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            JwtService jwtService,
            GoogleTokenVerifier googleTokenVerifier,
            @Value("${security.refresh-token.expiration-ms:1209600000}") long refreshTokenExpirationMs) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    @Transactional
    public AuthTokens loginWithGoogle(String idToken) {
        GoogleUserProfile profile = googleTokenVerifier.verify(idToken);
        User user = userRepository.findByProviderAndProviderUserId(PROVIDER, profile.subject())
                .orElseGet(() -> {
                    User created = new User();
                    created.setProvider(PROVIDER);
                    created.setProviderUserId(profile.subject());
                    created.setDisplayName(resolveDisplayName(profile));
                    return userRepository.save(created);
                });
        // Keep profile display name fresh on every login to avoid stale fallback values.
        user.setDisplayName(resolveDisplayName(profile));
        if (profile.pictureUrl() != null && !profile.pictureUrl().isBlank()) {
            user.setAvatarUrl(profile.pictureUrl().trim());
        }

        return issueTokenPair(user, UUID.randomUUID().toString());
    }

    @Transactional
    public AuthTokens refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        RefreshToken storedToken = refreshTokenRepository.findByJti(refreshToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (Boolean.TRUE.equals(storedToken.getRevoked())) {
            refreshTokenRepository.revokeActiveByUserAndFamily(storedToken.getUser(), storedToken.getFamilyId());
            throw new UnauthorizedException("Refresh token reuse detected");
        }

        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            storedToken.setRevoked(true);
            throw new UnauthorizedException("Refresh token expired");
        }

        // Rotate refresh token on every refresh call.
        storedToken.setRevoked(true);
        return issueTokenPair(storedToken.getUser(), storedToken.getFamilyId());
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByJti(refreshToken).ifPresent(token -> {
            refreshTokenRepository.revokeActiveByUserAndFamily(token.getUser(), token.getFamilyId());
        });
    }

    @Transactional(readOnly = true)
    public MyProfileResponse getMyProfile(String providerUserId) {
        User user = userRepository.findByProviderAndProviderUserId(PROVIDER, providerUserId)
                .orElseThrow(() -> new UnauthorizedException("Authentication required"));

        String displayName = user.getDisplayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = user.getProviderUserId();
        }
        return new MyProfileResponse(user.getProviderUserId(), displayName, user.getAvatarUrl());
    }

    private AuthTokens issueTokenPair(User user, String familyId) {
        String accessToken = jwtService.createToken(user.getProviderUserId());
        String nextRefreshToken = createRefreshToken(user, familyId);
        AuthResponse response = new AuthResponse(accessToken, user.getProviderUserId());
        return new AuthTokens(response, nextRefreshToken);
    }

    private String createRefreshToken(User user, String familyId) {
        String tokenValue = UUID.randomUUID() + "." + UUID.randomUUID();
        Instant now = Instant.now();

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setJti(tokenValue);
        token.setFamilyId(familyId);
        token.setIssuedAt(now);
        token.setExpiresAt(now.plusMillis(refreshTokenExpirationMs));
        token.setRevoked(false);
        refreshTokenRepository.save(token);

        return tokenValue;
    }

    public record AuthTokens(AuthResponse authResponse, String refreshToken) {
    }

    private String resolveDisplayName(GoogleUserProfile profile) {
        if (profile.name() != null && !profile.name().isBlank()) {
            return profile.name().trim();
        }
        if (profile.email() != null && !profile.email().isBlank()) {
            return profile.email().trim();
        }
        return profile.subject();
    }
}
