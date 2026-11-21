<<<<<<< HEAD
﻿# Reads settings from the environment (.env) with safe defaults.
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]   # the backend folder
=======
# Central place for app settings. Values come from environment variables (.env) with safe defaults.
import os
from pathlib import Path

from dotenv import load_dotenv

# backend/ folder (config.py -> core -> app -> backend)
BASE_DIR = Path(__file__).resolve().parents[2]

# Load backend/.env if it exists
>>>>>>> feature/backend-services
load_dotenv(BASE_DIR / ".env")


class Settings:
    APP_NAME: str = "GridSync API"
<<<<<<< HEAD
    DATABASE_URL: str = os.getenv("DATABASE_URL") or f"sqlite:///{(BASE_DIR / 'gridsync.db').as_posix()}"
    CORS_ORIGINS: list[str] = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]


settings = Settings()
=======
    # Default: SQLite file at backend/gridsync.db (as_posix avoids backslash problems on Windows)
    DATABASE_URL: str = os.getenv("DATABASE_URL") or f"sqlite:///{(BASE_DIR / 'gridsync.db').as_posix()}"
    # Comma-separated list of allowed frontend origins
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()
    ]


settings = Settings()
>>>>>>> feature/backend-services
