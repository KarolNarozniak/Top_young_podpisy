from __future__ import annotations

from pathlib import Path

from backend.config import Settings
from backend.scoring.grid import calculate_signature_coverage_score
from backend.scoring.model import predict_signature_score


class SignatureScoringError(RuntimeError):
    """Raised when neither the model scorer nor the fallback scorer can produce a score."""


class SignatureScoringService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def score_file(self, image_path: str | Path) -> int:
        resolved_path = Path(image_path)

        try:
            fallback_score = calculate_signature_coverage_score(resolved_path)
        except Exception as exc:
            fallback_score = None
            fallback_error = exc
        else:
            if fallback_score == 0:
                return 0

            model_score = predict_signature_score(resolved_path, self.settings)
            if model_score is not None:
                return self._normalize_score(model_score)

            return self._normalize_score(fallback_score)

        model_score = predict_signature_score(resolved_path, self.settings)
        if model_score is not None:
            return self._normalize_score(model_score)

        raise SignatureScoringError("No scoring strategy could process the uploaded file.") from fallback_error

    @staticmethod
    def _normalize_score(score: int | float) -> int:
        return max(0, min(100, int(round(score))))
