from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

DEFAULT_ALLOWED_MIME_TYPES = (
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
)

DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


@dataclass(frozen=True)
class Settings:
    api_title: str
    api_version: str
    model_path: Path
    model_image_size: int
    upload_chunk_size: int
    model_good_class_index: int
    allowed_mime_types: tuple[str, ...]
    allowed_origins: tuple[str, ...]
    backend_dir: Path
    project_root: Path


def _read_csv_env(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw_value = os.getenv(name)
    if not raw_value:
        return default

    values = tuple(item.strip() for item in raw_value.split(",") if item.strip())
    return values or default


def _read_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except ValueError:
        return default


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    configured_model_path = os.getenv("SIGNATURE_MODEL_PATH")

    return Settings(
        api_title=os.getenv("SIGNATURE_API_TITLE", "Signature Score API"),
        api_version=os.getenv("SIGNATURE_API_VERSION", "1.0.0"),
        model_path=Path(configured_model_path) if configured_model_path else BACKEND_DIR / "models" / "best_model_v5.pt",
        model_image_size=_read_int_env("SIGNATURE_MODEL_IMAGE_SIZE", 224),
        upload_chunk_size=_read_int_env("SIGNATURE_UPLOAD_CHUNK_SIZE", 1024 * 1024),
        model_good_class_index=_read_int_env("SIGNATURE_MODEL_GOOD_CLASS_INDEX", 0),
        allowed_mime_types=_read_csv_env("SIGNATURE_ALLOWED_MIME_TYPES", DEFAULT_ALLOWED_MIME_TYPES),
        allowed_origins=_read_csv_env("SIGNATURE_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS),
        backend_dir=BACKEND_DIR,
        project_root=PROJECT_ROOT,
    )

