from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["local", "staging", "production"] = "local"
    log_level: str = "INFO"

    database_url: str = "sqlite:///./aiready.db"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me"

    cors_origins: str = "http://localhost:3000"

    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-opus-4-7"

    databricks_host: str | None = None
    databricks_token: str | None = None
    databricks_warehouse_id: str | None = None

    snowflake_account: str | None = None
    snowflake_user: str | None = None
    snowflake_password: str | None = None
    snowflake_warehouse: str | None = None
    snowflake_role: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
