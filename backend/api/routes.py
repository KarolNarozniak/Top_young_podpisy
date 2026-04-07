from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from backend.config import get_settings
from backend.services.signature_scoring import SignatureScoringError, SignatureScoringService

router = APIRouter(prefix="/api")


class HealthResponse(BaseModel):
    status: str


class SignatureScoreResponse(BaseModel):
    score: int
    filename: str
    mimeType: str


@router.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post("/signature-score", response_model=SignatureScoreResponse)
async def signature_score(file: UploadFile = File(...)) -> SignatureScoreResponse:
    settings = get_settings()

    if file.content_type not in settings.allowed_mime_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PNG, JPG, JPEG, or WebP.",
        )

    suffix = Path(file.filename or "signature").suffix or ".png"
    temp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary_file:
            temp_path = temporary_file.name

            while chunk := await file.read(settings.upload_chunk_size):
                temporary_file.write(chunk)

        scoring_service = SignatureScoringService(settings)
        score = scoring_service.score_file(Path(temp_path))

        return SignatureScoreResponse(
            score=score,
            filename=file.filename or "signature",
            mimeType=file.content_type,
        )
    except SignatureScoringError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not analyze the uploaded signature: {exc}",
        ) from exc
    finally:
        await file.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

