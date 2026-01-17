from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Radiolite"
    API_V1_STR: str = "/api/v1"
    
    RADIO_BROWSER_URL: str = "https://de1.api.radio-browser.info/json"
    CACHE_MAX_SIZE: int = 100
    CACHE_TTL: int = 86400  # 24 hours
    
    GITHUB_TOKEN: str = ""
    GITHUB_REPO: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./radiolite.db"
    # Auth
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True

settings = Settings()
