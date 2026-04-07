# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_path: str = "best_model.pt"
    reject_threshold: float = 0.60
    img_size: int = 224

    class Config:
        env_file = ".env" # Mówimy skryptowi, skąd ma brać dane

settings = Settings()