import os
import sys
from pathlib import Path
from pydantic_settings import BaseSettings

def get_default_db_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url
    
    # Resolve safe local database path in user's home folder on desktop
    if os.name == "nt":  # Windows
        data_dir = Path(os.environ.get("APPDATA", ".")) / "Radiolite"
    elif sys.platform == "darwin":  # macOS
        data_dir = Path.home() / "Library" / "Application Support" / "Radiolite"
    else:  # Linux / Unix
        data_dir = Path.home() / ".local" / "share" / "radiolite"
        
    try:
        data_dir.mkdir(parents=True, exist_ok=True)
        db_path = data_dir / "radiolite.db"
        return f"sqlite+aiosqlite:///{db_path.as_posix()}"
    except Exception:
        return "sqlite+aiosqlite:///./radiolite.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Radiolite"
    API_V1_STR: str = "/api/v1"
    
    RADIO_BROWSER_URL: str = "https://de1.api.radio-browser.info/json"
    CACHE_MAX_SIZE: int = 100
    CACHE_TTL: int = 86400  # 24 hours
    
    GITHUB_TOKEN: str = ""
    GITHUB_REPO: str = ""

    DATABASE_URL: str = get_default_db_url()
    
    # Auth - Defaults are for local dev only. MUST be overridden in production.
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    SECRET_KEY: str = "unsafe-local-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

