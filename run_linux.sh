#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_PID=""

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

cleanup() {
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
    echo ""
    echo "Stopping backend process ${BACKEND_PID}..."
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
    wait "${BACKEND_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

require_command python3
require_command node
require_command npm

if [[ ! -d "${VENV_DIR}" ]]; then
  echo "Creating virtual environment in ${VENV_DIR}..."
  python3 -m venv "${VENV_DIR}"
fi

source "${VENV_DIR}/bin/activate"

echo "Installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r "${ROOT_DIR}/requirements.txt"

if [[ ! -d "${ROOT_DIR}/frontend/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  (
    cd "${ROOT_DIR}/frontend"
    npm install
  )
fi

echo "Starting backend on http://localhost:${BACKEND_PORT} ..."
(
  cd "${ROOT_DIR}"
  python -m uvicorn backend.app:app --host 0.0.0.0 --port "${BACKEND_PORT}" --reload
) &
BACKEND_PID=$!

sleep 3

echo "Backend URL:  http://localhost:${BACKEND_PORT}"
echo "Frontend URL: http://localhost:${FRONTEND_PORT}"
echo "Press Ctrl+C to stop both services."

(
  cd "${ROOT_DIR}/frontend"
  npm run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT}"
)
