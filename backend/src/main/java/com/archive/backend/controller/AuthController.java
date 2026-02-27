package com.archive.backend.controller;

import com.archive.backend.dto.ApiMessage;
import com.archive.backend.dto.AuthResponse;
import com.archive.backend.dto.GoogleLoginRequest;
import com.archive.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "arkeep_refresh_token";

    private final AuthService authService;
    private final long refreshTokenExpirationMs;
    private final boolean refreshCookieSecure;

    public AuthController(AuthService authService,
                          @Value("${security.refresh-token.expiration-ms:1209600000}") long refreshTokenExpirationMs,
                          @Value("${security.refresh-token.cookie-secure:false}") boolean refreshCookieSecure) {
        this.authService = authService;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.refreshCookieSecure = refreshCookieSecure;
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        AuthService.AuthTokens tokens = authService.loginWithGoogle(request.idToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(tokens.refreshToken()).toString())
                .body(tokens.authResponse());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        AuthService.AuthTokens tokens = authService.refresh(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildRefreshCookie(tokens.refreshToken()).toString())
                .body(tokens.authResponse());
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiMessage> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .body(new ApiMessage("Logged out"));
    }

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(refreshTokenExpirationMs / 1000)
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }
}
