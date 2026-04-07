import os
import tempfile
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from signatureAnalisys import calculate_signature_coverage_score as fallback_grid_score

MODEL_PATH = "models/best_model_v5.pt"
IMG_SIZE = 224
REJECT_THRESHOLD = 0.60

eval_tfms = transforms.Compose([
    transforms.Grayscale(num_output_channels=3),
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, 2)
model = model.to(device)

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()

def calculate_signature_score_integrated(image_path: str) -> int:
    try:
        img = Image.open(image_path).convert("RGB")
        img_tensor = eval_tfms(img).unsqueeze(0).to(device)
        with torch.no_grad():
            logits = model(img_tensor)
            probs = torch.softmax(logits, dim=1)
            prob_good = probs[0, 0].item()
            return int(prob_good * 100)
    except Exception:
        try:
            return fallback_grid_score(image_path)
        except Exception:
            return 6767

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
    allow_origins=["*"],
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

        score = calculate_signature_score_integrated(temp_path)
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
