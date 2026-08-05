from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_DB_URL: str

    # Embeddings (bge-m3)
    EMBED_API_URL: str = "https://lamhieu-lightweight-embeddings.hf.space/"
    EMBED_MODEL: str = "bge-m3"
    EMBED_DIM: int = 1024
    EMBED_AUTH_KEY: str = ""
    EMBED_MAX_TOKENS: int = 1000
    EMBED_TIMEOUT: int = 60
    EMBED_MAX_RETRIES: int = 3

    # LLM — Tencent Hy3, Gemini & Qwen Omni
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-3.1-flash-lite"
    LLM_RESPONSE_TIMEOUT: int = 1080
    MAX_LLM_RETRIES: int = 3
    MAX_TIMEOUT_RETRIES: int = 10

    # OCR — Mistral
    MISTRAL_OCR_SPACE: str = "tatendachirume/Mistral-OCR"
    MISTRAL_API_KEY: str = ""

    # Image — Qwen-VL Vision
    VISION_SPACE_URL: str = "Qwen/Qwen3-VL-30B-A3B-Demo"

    # Redis
    REDIS_URL: str = ""
    CACHE_TTL_SECONDS: int = 3600

    # Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # Re-ranking
    RERANK_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 20
    RATE_LIMIT_UPLOAD_PER_DAY: int = 50

    # Defaults
    DEFAULT_CHUNK_SIZE: int = 512
    DEFAULT_OVERLAP: int = 64
    DEFAULT_TOP_K: int = 5
    MAX_FILE_SIZE_MB: int = 50

    # CORS
    CORS_ORIGINS: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
