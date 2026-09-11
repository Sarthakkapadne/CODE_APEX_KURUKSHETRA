from __future__ import annotations
import os
from pathlib import Path
from pydantic_settings import BaseSettings

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

# Force load backend/.env over any stale system environment variables
load_dotenv(BASE_DIR / ".env", override=True)


class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR.parent}/lexport.db")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    APP_VERSION: str = "1.0.0"
    RULE_ENGINE_VERSION: str = "LexPort-Rules-v2026.1"
    ENVIRONMENT: str = "development"
    STATIC_DIR: str = str(STATIC_DIR)

    class Config:
        env_file = str(BASE_DIR / ".env")
        extra = "allow"


_settings = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
