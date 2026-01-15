from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Radiolite"
    API_V1_STR: str = "/api/v1"
    
    RADIO_BROWSER_URL: str = "https://de1.api.radio-browser.info/json"
    CACHE_MAX_SIZE: int = 100
    CACHE_TTL: int = 86400  # 24 hours

    class Config:
        case_sensitive = True

settings = Settings()
