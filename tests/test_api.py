from __future__ import annotations

import io

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from backend.app import app

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

