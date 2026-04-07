from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from backend.config import get_settings
from backend.scoring.model import predict_signature_score


def test_predict_signature_score_returns_none_when_model_file_is_missing() -> None:
    settings = replace(
        get_settings(),
        model_path=Path("C:/this/path/does/not/exist/best_model.pt"),
    )

    assert predict_signature_score("unused.png", settings) is None

