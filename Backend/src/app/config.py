from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "it-cube-platform"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    database_url: str = Field(
        default="postgresql+asyncpg://itkub:itcube@localhost:5432/itcube",
    )

    secret_key: str = Field(
        default="dev-only-change-in-production-use-openssl-rand-hex-32",
        min_length=32,
    )
    access_token_expire_minutes: int = 30
    password_hash_scheme: str = "bcrypt"

    otp_length: int = 6
    otp_ttl_seconds: int = 600
    otp_max_attempts: int = 5
    otp_resend_cooldown_seconds: int = 60

    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@itcube.local"
    smtp_tls: bool = False

    sms_provider: str = "mock"
    sms_api_key: str = ""
    sms_sender: str = "IT-CUBE"

    redis_url: str = "redis://localhost:6379/0"
    export_max_rows: int = 10_000

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def database_url_sync(self) -> str:
        return self.database_url.replace("postgresql+asyncpg", "postgresql+psycopg")


settings = Settings()
