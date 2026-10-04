from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    ENV: str = "development"
    ANTHROPIC_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    ALLOWED_ORIGINS: str = ""
    RATE_LIMIT_PER_MINUTE: int = 5
    DAILY_REQUEST_CAP: int = 100

    @property
    def cors_origins(self) -> List[str]:
        origins = [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        if self.ENV != "production":
            origins.append("http://localhost:5173")
        return origins

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

EXTRACTION_MODEL = "claude-haiku-4-5-20251001"
VERIFICATION_MODEL = "claude-sonnet-4-20250514"

ANSWER_MAX_LENGTH = 4000
QUESTION_MAX_LENGTH = 500
MAX_CLAIMS = 8
