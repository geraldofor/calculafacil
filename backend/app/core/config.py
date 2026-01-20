from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent

class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Calcula Fácil"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "calcula_facil"
    
    # CORS
    CORS_ORIGINS: str = "*"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    class Config:
        case_sensitive = True
        env_file = str(ROOT_DIR / ".env")
        
    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

settings = Settings()
