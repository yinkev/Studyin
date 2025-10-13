from __future__ import annotations

from pathlib import Path
from typing import List

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration."""

    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://studyin_user:changeme@localhost:5432/studyin"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 1800

    # Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str | None = None

    # File upload security
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
    USER_STORAGE_QUOTA: int = 5 * 1024 * 1024 * 1024  # 5 GB
    UPLOAD_DIR: str = str((Path(__file__).resolve().parent.parent / "uploads").resolve())
    CDN_DOMAIN: str = "cdn.studyin.app"
    CHROMA_PERSIST_DIR: str = str((Path(__file__).resolve().parent.parent / "chroma_data").resolve())

    # Auth
    JWT_ACCESS_SECRET: str = "local-access-secret"
    JWT_REFRESH_SECRET: str = "local-refresh-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Security services
    CLAMAV_HOST: str | None = None
    CLAMAV_PORT: int = 3310
    CLAMAV_SOCKET: str | None = None

    # CORS - Using simple string for now to avoid pydantic parsing issues
    CORS_ALLOW_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    CORS_ALLOW_ORIGIN_REGEX: str | None = None
    CORS_ALLOW_METHODS: str = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    CORS_ALLOW_HEADERS: str = "Authorization,Content-Type,X-CSRF-Token"

    # LLM Provider Switch
    # - "codex_cli": use the Codex CLI integration (current/default)
    # - "openai_chatmock": use local OpenAI-compatible server (e.g., ChatMock)
    # - "openai_cloud": use OpenAI cloud
    LLM_PROVIDER: str = "codex_cli"

    # OpenAI-compatible settings (used when LLM_PROVIDER starts with "openai_")
    OPENAI_BASE_URL: str | None = None  # e.g., "http://127.0.0.1:8801/v1" for ChatMock
    OPENAI_API_KEY: str | None = None   # ChatMock accepts any non-empty value (e.g., "x")
    OPENAI_DEFAULT_MODEL: str = "gpt-5"  # can be overridden per-request (e.g., gpt-5-high)

    # LLM Configuration (Codex CLI - no API keys needed!)
    CODEX_CLI_PATH: str = "/opt/homebrew/bin/codex"
    CODEX_DEFAULT_MODEL: str = "gpt-5"  # or "claude-3.5-sonnet", "gpt-5-codex", etc.
    CODEX_TEMPERATURE: float = 0.7
    CODEX_MAX_TOKENS: int = 128000  # GPT-5: 128K output, GPT-4o: 16K output, Claude 3.5: 8K output
    CODEX_STREAM_TIMEOUT: float = 30.0  # Timeout for individual readline operations (seconds)
    CODEX_MAX_RESPONSE_SIZE: int = 1024 * 1024  # Maximum accumulated response size (1MB)
    CODEX_PROCESS_CLEANUP_TIMEOUT: float = 5.0  # Timeout for process cleanup in finally block (seconds)
    CODEX_MAX_PROMPT_LENGTH: int = 51200  # Maximum prompt size (50KB) - security limit to prevent memory exhaustion

    # Gemini Embeddings (Text-only)
    GEMINI_API_KEY: str | None = None
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"  # latest text embedding model
    GEMINI_EMBEDDING_DIM: int = 1536  # recommended default; make it configurable

    # Monitoring
    LOG_LEVEL: str = "INFO"
    PROMETHEUS_PORT: int = 9090

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @field_validator("ENVIRONMENT")
    @classmethod
    def _validate_environment(cls, value: str) -> str:
        normalized = value.lower()
        if normalized not in {"development", "staging", "production"}:
            raise ValueError("ENVIRONMENT must be one of: development, staging, production")
        return normalized

    def get_cors_origins_list(self) -> List[str]:
        """Convert CORS_ALLOW_ORIGINS string to list."""
        return [item.strip() for item in self.CORS_ALLOW_ORIGINS.split(",") if item.strip()]

    def get_cors_methods_list(self) -> List[str]:
        """Convert CORS_ALLOW_METHODS string to list."""
        return [item.strip() for item in self.CORS_ALLOW_METHODS.split(",") if item.strip()]

    def get_cors_headers_list(self) -> List[str]:
        """Convert CORS_ALLOW_HEADERS string to list."""
        return [item.strip() for item in self.CORS_ALLOW_HEADERS.split(",") if item.strip()]

    @field_validator("MAX_UPLOAD_SIZE", "USER_STORAGE_QUOTA")
    @classmethod
    def _validate_positive_sizes(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Size limits must be positive integers")
        return value

    @field_validator("UPLOAD_DIR", mode="after")
    @classmethod
    def _resolve_upload_dir(cls, value: str) -> str:
        return str(Path(value).resolve())

    @field_validator("CHROMA_PERSIST_DIR", mode="after")
    @classmethod
    def _resolve_chroma_dir(cls, value: str) -> str:
        return str(Path(value).resolve())

    @model_validator(mode="after")
    def _validate_security_sensitive(self) -> "Settings":
        if self.ENVIRONMENT in {"staging", "production"}:
            if self.JWT_ACCESS_SECRET == "local-access-secret" or self.JWT_REFRESH_SECRET == "local-refresh-secret":
                raise ValueError("JWT secrets must be overridden in staging/production environments")

            if "*" in self.CORS_ALLOW_ORIGINS:
                raise ValueError("Wildcard CORS origins are not allowed in staging/production")

        if not self.CORS_ALLOW_ORIGINS and not self.CORS_ALLOW_ORIGIN_REGEX:
            raise ValueError("At least one CORS allow origin or regex must be configured")

        if self.DATABASE_POOL_SIZE <= 0:
            raise ValueError("DATABASE_POOL_SIZE must be greater than zero")

        if self.DATABASE_MAX_OVERFLOW < 0:
            raise ValueError("DATABASE_MAX_OVERFLOW cannot be negative")

        Path(self.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)

        return self


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
