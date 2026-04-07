# Signature Score Verifier

Signature Score Verifier is a full-stack project for uploading handwritten signature images and scoring their readability. The repository is organized into a clean runtime structure with a Python backend, a React frontend, and a separate archive for training and research material.

## Project Structure

```text
.
|-- backend/
|   |-- api/                  # FastAPI routes and response models
|   |-- models/               # Runtime ML model assets
|   |-- scoring/              # ML scoring and grid-based fallback logic
|   |-- services/             # Orchestration layer between API and scoring
|   |-- tests/                # Backend tests
|   |-- app.py                # Official ASGI entrypoint
|   `-- config.py             # Backend runtime configuration
|-- frontend/                 # Vite + React application
|-- Training&Data/            # Research notebooks, archived output, legacy scripts
|-- .gitignore
|-- requirements.txt          # Single Python dependency file
`-- run_linux.sh              # Linux development launcher
```

## Backend Architecture

- `backend.app` is the only official ASGI entrypoint.
- `backend.api.routes` handles HTTP validation, temporary upload files, and response models.
- `backend.services.signature_scoring` coordinates model-based scoring and the deterministic fallback.
- `backend.scoring.model` lazily loads the ResNet model and returns `None` when the model or ML dependencies are unavailable.
- `backend.scoring.grid` provides the grid-based fallback score.
- `backend.config` centralizes runtime settings such as model path, image size, chunk size, allowed MIME types, and allowed CORS origins.

## Frontend Architecture

- The frontend is a Vite React app with one focused flow: upload, loading, result, or error.
- Upload UX lives in `frontend/src/components/upload-dropzone.tsx`.
- API communication lives in `frontend/src/services/api.ts`.
- The result and loading states are split into dedicated components for easier maintenance.

## Installation

Install Python dependencies from the repository root:

```bash
python -m pip install -r requirements.txt
```

Install frontend dependencies from `frontend/`:

```bash
npm install
```

## Local Development

Start the backend from the repository root:

```bash
python -m uvicorn backend.app:app --reload
```

Backend URLs:

```text
API:    http://localhost:8000
Health: http://localhost:8000/api/health
```

Start the frontend from `frontend/`:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to the backend, so the frontend can call the backend without hardcoding a separate local base URL.

## Linux Run Script

The root `run_linux.sh` script starts the backend and frontend together for local development.

Usage:

```bash
chmod +x run_linux.sh
./run_linux.sh
```

The script:

- checks for `python3`, `node`, and `npm`
- creates or reuses a root `.venv`
- installs Python dependencies from the merged root `requirements.txt`
- installs frontend dependencies if `frontend/node_modules` is missing
- starts the backend on port `8000`
- starts the frontend on port `5173`
- stops the backend automatically when the frontend process exits

## Testing

Run backend tests from the repository root:

```bash
python -m pytest backend/tests
```

Run frontend tests from `frontend/`:

```bash
npm run test:run
```

Build the frontend from `frontend/`:

```bash
npm run build
```

## Model Asset Placement

The backend expects the runtime model file here by default:

```text
backend/models/best_model_v5.pt
```

You can override the model path with:

```bash
SIGNATURE_MODEL_PATH=/custom/path/to/model.pt
```

If the model file is missing, unreadable, or ML dependencies are unavailable, the backend falls back to the grid-based scoring algorithm instead of crashing.

## Configuration

The backend reads these optional environment variables:

- `SIGNATURE_MODEL_PATH`
- `SIGNATURE_MODEL_IMAGE_SIZE`
- `SIGNATURE_UPLOAD_CHUNK_SIZE`
- `SIGNATURE_MODEL_GOOD_CLASS_INDEX`
- `SIGNATURE_ALLOWED_MIME_TYPES`
- `SIGNATURE_ALLOWED_ORIGINS`
- `SIGNATURE_API_TITLE`
- `SIGNATURE_API_VERSION`

Comma-separated values are supported for MIME types and CORS origins.

## Archive Area

`Training&Data/` contains notebooks, generated output, and legacy scripts that are intentionally separated from the runtime application code.

## Troubleshooting

### Could not import module `backend.app`

Use the official startup command from the repository root:

```bash
python -m uvicorn backend.app:app --reload
```

### `ModuleNotFoundError: No module named 'torch'`

Install the merged root dependencies:

```bash
python -m pip install -r requirements.txt
```

The backend can still fall back to the grid scorer if the model path or runtime ML dependencies are unavailable.

### Frontend upload issues

If the frontend was already running during cleanup changes, restart the dev server:

```bash
npm run dev
```

### Browser tab icon does not refresh

Hard refresh the browser with `Ctrl+F5` after restarting the frontend.
