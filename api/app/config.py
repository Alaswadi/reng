import os


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    database_url: str = os.getenv("DATABASE_URL", "postgresql://recon:recon@postgres:5432/recon")
    redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    minio_endpoint: str = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "*")


settings = Settings()
