#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"

cd "${PROJECT_ROOT}"

if [[ "${1:-start}" == "stop" ]]; then
  echo "Stopping Habit app containers..."
  docker compose down
  exit 0
fi

if [[ "${1:-start}" == "start" ]]; then
  echo "Starting Habit app containers..."
  docker compose up --build -d
  echo ""
  echo "App: http://localhost:3002"
  echo "Vite: http://localhost:5175"
  echo "Postgres: localhost:5432"
  exit 0
fi

echo "Usage: ./start.sh [start|stop]"
exit 1
