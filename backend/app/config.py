from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DB_HOST: str

    DB_PORT: int

    DB_NAME: str

    DB_USER: str

    DB_PASSWORD: str

    REDIS_URL: str

    SECRET_KEY: str

    API_HOST: str = "127.0.0.1"

    API_PORT: int = 8000

    DEBUG: bool = True

    class Config:

        env_file = ".env"


settings = Settings()