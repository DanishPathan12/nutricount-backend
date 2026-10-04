import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the ai-service
BASE_DIR = Path(__file__).resolve().parent.parent
PARENT_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    """
    Application settings loaded from environment or .env files.
    Checks local ai-service/.env first, then parent .env.
    """
    APP_NAME: str = "Nutricount AI Service"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Gemini AI configuration
    GEMINI_API_KEY: str = ""
    DEFAULT_MODEL: str = "gemini-2.5-flash"
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    model_config = SettingsConfigDict(
        env_file=(str(PARENT_DIR / ".env"), str(BASE_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
