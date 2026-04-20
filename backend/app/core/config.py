from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Mis Eventos API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/mis_eventos"
    backend_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    media_root: str = "/app/media"
    media_url_prefix: str = "/media"
    image_upload_max_size_mb: int = 8
    redis_url: str = ""
    cache_ttl_seconds: int = 60
    admin_email: str = "madebygarzon@gmail.com"
    super_admin_email_legacy: str | None = Field(default=None, validation_alias="SUPER_ADMIN_EMAIL")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
