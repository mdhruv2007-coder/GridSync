# Reads settings from the environment (.env) with safe defaults.
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]   # the backend folder
load_dotenv(BASE_DIR / ".env")


class Settings:
    APP_NAME: str = "GridSync API"
    DATABASE_URL: str = os.getenv("DATABASE_URL") or f"sqlite:///{(BASE_DIR / 'gridsync.db').as_posix()}"
    CORS_ORIGINS: list[str] = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]


settings = Settings()
