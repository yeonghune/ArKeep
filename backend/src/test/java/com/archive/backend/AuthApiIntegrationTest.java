package com.archive.backend;

import static org.mockito.BDDMockito.given;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.archive.backend.auth.GoogleTokenVerifier;
import com.archive.backend.auth.GoogleUserProfile;
import com.archive.backend.repository.RefreshTokenRepository;
import com.archive.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GoogleTokenVerifier googleTokenVerifier;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void googleLogin_shouldCreateUserAndIssueToken() throws Exception {
        given(googleTokenVerifier.verify("valid-google-token"))
                .willReturn(new GoogleUserProfile("google-sub-123", "user@example.com", "User One", "https://example.com/avatar.png"));

        mockMvc.perform(post("/auth/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"valid-google-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.email").value("google-sub-123"));
    }

    @Test
    void googleLogin_withInvalidToken_shouldReturn400() throws Exception {
        given(googleTokenVerifier.verify("invalid-google-token"))
                .willThrow(new IllegalArgumentException("Invalid Google id token"));

        mockMvc.perform(post("/auth/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"invalid-google-token\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("Invalid Google id token"));
    }

    @Test
    void googleLogin_withoutIdToken_shouldReturn400() throws Exception {
        mockMvc.perform(post("/auth/google")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("idToken is required"));
    }

    @Test
    void refresh_shouldRotateRefreshToken() throws Exception {
        given(googleTokenVerifier.verify("valid-google-token"))
                .willReturn(new GoogleUserProfile("google-sub-123", "user@example.com", "User One", "https://example.com/avatar.png"));

        MvcResult loginResult = mockMvc.perform(post("/auth/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"valid-google-token\"}"))
                .andExpect(status().isOk())
                .andReturn();

        String oldRefreshTokenCookie = toCookieHeader(loginResult.getResponse().getHeader(HttpHeaders.SET_COOKIE));

        MvcResult refreshResult = mockMvc.perform(post("/auth/refresh")
                        .header(HttpHeaders.COOKIE, oldRefreshTokenCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.email").value("google-sub-123"))
                .andReturn();

        String newRefreshTokenCookie = toCookieHeader(refreshResult.getResponse().getHeader(HttpHeaders.SET_COOKIE));

        org.junit.jupiter.api.Assertions.assertNotEquals(oldRefreshTokenCookie, newRefreshTokenCookie);

        mockMvc.perform(post("/auth/refresh")
                        .header(HttpHeaders.COOKIE, oldRefreshTokenCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Refresh token reuse detected"));
    }

    @Test
    void logout_shouldRevokeRefreshToken() throws Exception {
        given(googleTokenVerifier.verify("valid-google-token"))
                .willReturn(new GoogleUserProfile("google-sub-123", "user@example.com", "User One", "https://example.com/avatar.png"));

        MvcResult loginResult = mockMvc.perform(post("/auth/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"valid-google-token\"}"))
                .andExpect(status().isOk())
                .andReturn();

        String refreshTokenCookie = toCookieHeader(loginResult.getResponse().getHeader(HttpHeaders.SET_COOKIE));

        mockMvc.perform(post("/auth/logout")
                        .header(HttpHeaders.COOKIE, refreshTokenCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out"));

        mockMvc.perform(post("/auth/refresh")
                        .header(HttpHeaders.COOKIE, refreshTokenCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Refresh token reuse detected"));
    }

    @Test
    void me_shouldReturnProfileWithAvatar() throws Exception {
        given(googleTokenVerifier.verify("valid-google-token"))
                .willReturn(new GoogleUserProfile("google-sub-123", "user@example.com", "User One", "https://example.com/avatar.png"));

        MvcResult loginResult = mockMvc.perform(post("/auth/google")
                        .contentType(APPLICATION_JSON)
                        .content("{\"idToken\":\"valid-google-token\"}"))
                .andExpect(status().isOk())
                .andReturn();

        String token = extractJsonField(loginResult, "token");

        mockMvc.perform(get("/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("google-sub-123"))
                .andExpect(jsonPath("$.displayName").value("User One"))
                .andExpect(jsonPath("$.avatarUrl").value("https://example.com/avatar.png"));
    }

    private String toCookieHeader(String setCookieHeader) {
        return setCookieHeader == null ? "" : setCookieHeader.split(";", 2)[0];
    }

    private String extractJsonField(MvcResult result, String fieldName) throws Exception {
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get(fieldName).asText();
    }
}
