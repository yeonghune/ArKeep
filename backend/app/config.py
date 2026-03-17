from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://archive:archive@db:5432/article_archive"
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = ""
    JWT_SECRET: str = "change-me"
    JWT_EXPIRATION_MS: int = 86_400_000        # 24h
    REFRESH_TOKEN_EXPIRATION_MS: int = 1_209_600_000  # 14d
    REFRESH_TOKEN_COOKIE_SECURE: bool = False
    GOOGLE_CLIENT_IDS: str = ""
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def google_client_id_list(self) -> list[str]:
        return [s.strip() for s in self.GOOGLE_CLIENT_IDS.split(",") if s.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [s.strip() for s in self.CORS_ALLOWED_ORIGINS.split(",") if s.strip()]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
