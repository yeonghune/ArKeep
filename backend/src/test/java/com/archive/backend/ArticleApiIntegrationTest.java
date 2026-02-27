package com.archive.backend;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.archive.backend.domain.User;
import com.archive.backend.metadata.OgMetadata;
import com.archive.backend.metadata.TitleExtractor;
import com.archive.backend.repository.ArticleRepository;
import com.archive.backend.repository.UserRepository;
import com.archive.backend.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ArticleApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private TitleExtractor titleExtractor;

    private String accessToken;

    @BeforeEach
    void setUp() {
        articleRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User();
        user.setProvider("GOOGLE");
        user.setProviderUserId("article-test-user");
        user.setDisplayName("article-test-user");
        userRepository.save(user);
        accessToken = jwtService.createToken(user.getProviderUserId());

        given(titleExtractor.extract(anyString()))
                .willAnswer(invocation -> new OgMetadata("Title for " + invocation.getArgument(0, String.class), null, null));
    }

    @Test
    void listWithoutAuthentication_shouldReturn401() throws Exception {
        mockMvc.perform(get("/articles"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void metadataPreview_shouldAllowWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/metadata/preview")
                        .contentType(APPLICATION_JSON)
                        .content("{\"url\":\"https://example.com/preview\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://example.com/preview"))
                .andExpect(jsonPath("$.title").value("Title for https://example.com/preview"))
                .andExpect(jsonPath("$.domain").value("example.com"));
    }

    @Test
    void createAndList_shouldWorkWithAuthentication() throws Exception {
        long firstId = createArticle("https://example.com/first");
        Thread.sleep(5L);
        long secondId = createArticle("https://example.com/second");

        performAuthenticated(get("/articles").queryParam("sort", "latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(secondId))
                .andExpect(jsonPath("$.items[1].id").value(firstId));

        performAuthenticated(get("/articles").queryParam("sort", "oldest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(firstId))
                .andExpect(jsonPath("$.items[1].id").value(secondId));
    }

    @Test
    void duplicateCreate_shouldReturn409() throws Exception {
        createArticle("https://example.com/dup");

        performAuthenticated(post("/articles")
                        .contentType(APPLICATION_JSON)
                        .content("{\"url\":\"https://example.com/dup\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Article already saved"));
    }

    @Test
    void migrate_shouldCreateAndSkipDuplicates() throws Exception {
        createArticle("https://example.com/existing");

        performAuthenticated(post("/articles/migrate")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "items": [
                                    {
                                      "url": "https://example.com/existing",
                                      "title": "Existing",
                                      "category": "dev",
                                      "isRead": true
                                    },
                                    {
                                      "url": "https://example.com/new-one",
                                      "title": "New One",
                                      "description": "from local",
                                      "domain": "example.com",
                                      "category": "design",
                                      "isRead": false
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.created").value(1))
                .andExpect(jsonPath("$.duplicates").value(1))
                .andExpect(jsonPath("$.failed").value(0));
    }

    @Test
    void patchAndDelete_shouldWorkWithAuthentication() throws Exception {
        long id = createArticle("https://example.com/patch-delete", "dev");

        performAuthenticated(patch("/articles/{id}", id)
                        .contentType(APPLICATION_JSON)
                        .content("{\"isRead\":true,\"category\":\"design\",\"description\":\"memo text\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true))
                .andExpect(jsonPath("$.category").value("design"))
                .andExpect(jsonPath("$.description").value("memo text"));

        performAuthenticated(delete("/articles/{id}", id))
                .andExpect(status().isNoContent());
    }

    @Test
    void createWithDescription_shouldUseProvidedDescription() throws Exception {
        performAuthenticated(post("/articles")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://example.com/with-description",
                                  "description": "custom memo"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("custom memo"));
    }

    @Test
    void filtersPaginationAndFacets_shouldWorkWithAuthentication() throws Exception {
        createArticle("https://example.com/a-1", "dev");
        createArticle("https://example.com/a-2", "dev");
        createArticle("https://another.com/b-1", "design");

        performAuthenticated(get("/articles")
                        .queryParam("q", "a-")
                        .queryParam("page", "1")
                        .queryParam("size", "1")
                        .queryParam("sort", "latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.totalItems").value(2))
                .andExpect(jsonPath("$.totalPages").value(2));

        performAuthenticated(get("/articles").queryParam("category", "dev"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));

        performAuthenticated(get("/articles").queryParam("domain", "another.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        performAuthenticated(get("/articles/facets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories.length()").value(2))
                .andExpect(jsonPath("$.domains.length()").value(2));
    }

    private long createArticle(String url) throws Exception {
        return createArticle(url, null);
    }

    private long createArticle(String url, String category) throws Exception {
        String body = category == null
                ? "{\"url\":\"" + url + "\"}"
                : "{\"url\":\"" + url + "\",\"category\":\"" + category + "\"}";
        String response = performAuthenticated(post("/articles")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(StandardCharsets.UTF_8);

        JsonNode node = objectMapper.readTree(response);
        return node.get("id").asLong();
    }

    private ResultActions performAuthenticated(MockHttpServletRequestBuilder requestBuilder) throws Exception {
        return mockMvc.perform(requestBuilder.header(HttpHeaders.AUTHORIZATION, bearerToken()));
    }

    private String bearerToken() {
        return "Bearer " + accessToken;
    }
}
