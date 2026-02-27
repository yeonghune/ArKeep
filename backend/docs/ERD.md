# ArKeep ERD (Google OAuth 湲곗?)

ERDCloud import??SQL? `backend/docs/erdcloud-import.sql` ?뚯씪???ъ슜.

```mermaid
erDiagram
    USERS {
        BIGINT id PK
        UUID public_id UK
        VARCHAR provider "NOT NULL (e.g. GOOGLE)"
        VARCHAR provider_user_id "NOT NULL"
        VARCHAR display_name
        VARCHAR avatar_url
        TIMESTAMP created_at "NOT NULL"
    }

    ARTICLES {
        BIGINT id PK
        UUID public_id UK
        BIGINT user_id FK "NOT NULL"
        VARCHAR url "NOT NULL"
        VARCHAR title "NOT NULL"
        VARCHAR description
        VARCHAR thumbnail_url
        VARCHAR domain "NOT NULL"
        VARCHAR category
        BOOLEAN is_read "NOT NULL, default false"
        TIMESTAMP created_at "NOT NULL"
    }

    REFRESH_TOKENS {
        BIGINT id PK
        BIGINT user_id FK "NOT NULL"
        VARCHAR jti "NOT NULL, UNIQUE"
        VARCHAR family_id "NOT NULL"
        TIMESTAMP issued_at "NOT NULL"
        TIMESTAMP expires_at "NOT NULL"
        BOOLEAN revoked "NOT NULL, default false"
    }

    USERS ||--o{ ARTICLES : owns
    USERS ||--o{ REFRESH_TOKENS : has
```

## Constraints

- `users`: `UNIQUE(provider, provider_user_id)`
- `articles`: `INDEX(user_id)`, `INDEX(status)`, `UNIQUE(user_id, url)` (以묐났 ???諛⑹???
- `refresh_tokens`: `INDEX(user_id)`, `UNIQUE(token_hash)`

