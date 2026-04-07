from __future__ import annotations

import io
from dataclasses import replace
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from backend.app import app
from backend.config import get_settings

client = TestClient(app)


def make_signature_image() -> io.BytesIO:
    img = Image.new("RGBA", (320, 160), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    draw.line((24, 80, 92, 36), fill=(18, 18, 18, 255), width=7)
    draw.line((92, 36, 164, 104), fill=(18, 18, 18, 255), width=7)
    draw.line((164, 104, 292, 58), fill=(18, 18, 18, 255), width=7)

    payload = io.BytesIO()
    img.save(payload, format="PNG")
    payload.seek(0)
    return payload


def make_blank_image() -> io.BytesIO:
    img = Image.new("RGBA", (320, 160), (255, 255, 255, 0))
    payload = io.BytesIO()
    img.save(payload, format="PNG")
    payload.seek(0)
    return payload


def test_signature_score_returns_json_shape() -> None:
    response = client.post(
        "/api/signature-score",
        files={"file": ("signature.png", make_signature_image(), "image/png")},
    )

    assert response.status_code == 200
    body = response.json()

    assert body["filename"] == "signature.png"
    assert body["mimeType"] == "image/png"
    assert isinstance(body["score"], int)
    assert 0 <= body["score"] <= 100
    assert body["score"] > 0


def test_signature_score_returns_zero_for_empty_image() -> None:
    response = client.post(
        "/api/signature-score",
        files={"file": ("blank.png", make_blank_image(), "image/png")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "score": 0,
        "filename": "blank.png",
        "mimeType": "image/png",
    }


def test_signature_score_rejects_unsupported_file_types() -> None:
    response = client.post(
        "/api/signature-score",
        files={"file": ("notes.txt", io.BytesIO(b"invalid"), "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported file type. Please upload PNG, JPG, JPEG, or WebP."


def test_signature_score_falls_back_cleanly_when_model_file_is_missing(monkeypatch) -> None:
    settings = replace(
        get_settings(),
        model_path=Path("C:/this/path/does/not/exist/best_model.pt"),
    )
    monkeypatch.setattr("backend.api.routes.get_settings", lambda: settings)

    response = client.post(
        "/api/signature-score",
        files={"file": ("signature.png", make_signature_image(), "image/png")},
    )

    assert response.status_code == 200
    assert 0 <= response.json()["score"] <= 100
