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
    UPLOAD_DIR: str = str(Path("/var/www/studyin/uploads").resolve())
    CDN_DOMAIN: str = "cdn.studyin.app"

    # Auth
    JWT_ACCESS_SECRET: str = "local-access-secret"
    JWT_REFRESH_SECRET: str = "local-refresh-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Security services
    CLAMAV_HOST: str | None = None
    CLAMAV_PORT: int = 3310
    CLAMAV_SOCKET: str | None = None

    # CORS
    CORS_ALLOW_ORIGINS: List[str] = ["http://localhost:3000"]
    CORS_ALLOW_ORIGIN_REGEX: str | None = None
    CORS_ALLOW_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    CORS_ALLOW_HEADERS: List[str] = ["Authorization", "Content-Type", "X-CSRF-Token"]

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

    @field_validator("CORS_ALLOW_ORIGINS", "CORS_ALLOW_METHODS", "CORS_ALLOW_HEADERS", mode="before")
    @classmethod
    def _split_csv(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

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

        return self


def get_settings() -> Settings:
    return Settings()


settings = get_settings()
