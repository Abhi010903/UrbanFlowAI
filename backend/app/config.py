from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "urbanflowai"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"

    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "urbanflowai-secret-key-change-in-production"

    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    DEBUG: bool = Field(default=True, validation_alias="APP_DEBUG")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
