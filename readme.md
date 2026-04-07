Top Young signature readability project.

This repository now contains:
- a temporary FastAPI backend that scores uploaded signature images
- a React frontend for drag and drop upload, loading feedback, and result display

Backend:
- install dependencies with `python -m pip install -r requirements.txt`
- run with `python -m uvicorn backend.app:app --reload`

Frontend:
- `cd frontend`
- install dependencies with `cmd /c npm install`
- start the dev server with `cmd /c npm run dev`

Tests:
- backend: `python -m pytest`
- frontend: `cd frontend` then `cmd /c npm run test:run`
