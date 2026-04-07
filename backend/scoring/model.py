from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

from PIL import Image

from backend.config import Settings


@dataclass(frozen=True)
class ModelRuntime:
    torch: Any
    model: Any
    device: Any
    transform: Any
    good_class_index: int


def _import_model_dependencies() -> tuple[Any, Any, Any, Any] | None:
    try:
        import torch
        import torch.nn as nn
        from torchvision import models, transforms
    except ImportError:
        return None

    return torch, nn, models, transforms


def _load_model_runtime(
    model_path: str,
    image_size: int,
    good_class_index: int,
) -> ModelRuntime | None:
    dependencies = _import_model_dependencies()
    resolved_model_path = Path(model_path)

    if dependencies is None or not resolved_model_path.exists():
        return None

    return _load_model_runtime_cached(model_path, image_size, good_class_index)


@lru_cache(maxsize=1)
def _load_model_runtime_cached(
    model_path: str,
    image_size: int,
    good_class_index: int,
) -> ModelRuntime:
    dependencies = _import_model_dependencies()
    if dependencies is None:
        raise RuntimeError("Model dependencies are unavailable.")

    torch, nn, models, transforms = dependencies
    resolved_model_path = Path(model_path)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    transform = transforms.Compose(
        [
            transforms.Grayscale(num_output_channels=3),
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    model = models.resnet50(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)
    model.load_state_dict(torch.load(resolved_model_path, map_location=device))
    model = model.to(device)
    model.eval()

    return ModelRuntime(
        torch=torch,
        model=model,
        device=device,
        transform=transform,
        good_class_index=good_class_index,
    )


def predict_signature_score(image_path: str | Path, settings: Settings) -> int | None:
    runtime = _load_model_runtime(
        str(settings.model_path),
        settings.model_image_size,
        settings.model_good_class_index,
    )

    if runtime is None:
        return None

    try:
        image = Image.open(image_path).convert("RGB")
        image_tensor = runtime.transform(image).unsqueeze(0).to(runtime.device)

        with runtime.torch.no_grad():
            logits = runtime.model(image_tensor)
            probabilities = runtime.torch.softmax(logits, dim=1)
            score = probabilities[0, runtime.good_class_index].item() * 100

        return max(0, min(100, int(round(score))))
    except Exception:
        return None
