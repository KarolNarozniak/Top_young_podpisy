from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from signatureAnalisys import calculate_signature_coverage_score

ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


class SignatureScoreResponse(BaseModel):
    score: int
    filename: str
    mimeType: str


app = FastAPI(
    title="Signature Score API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/signature-score", response_model=SignatureScoreResponse)
async def signature_score(file: UploadFile = File(...)) -> SignatureScoreResponse:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PNG, JPG, JPEG, or WebP.",
        )

    suffix = Path(file.filename or "signature").suffix or ".png"
    temp_path: str | None = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            temp_path = tmp_file.name
            while chunk := await file.read(1024 * 1024):
                tmp_file.write(chunk)

        score = calculate_signature_coverage_score(temp_path)
        return SignatureScoreResponse(
            score=score,
            filename=file.filename or "signature",
            mimeType=file.content_type,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not analyze the uploaded signature: {exc}",
        ) from exc
    finally:
        await file.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

