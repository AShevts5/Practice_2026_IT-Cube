#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

if [ "${RUN_SEED}" = "true" ]; then
  echo "Seeding development data..."
  python scripts/seed_dev.py
fi

if [ "${RUN_RELOAD}" = "true" ]; then
  echo "Starting API with hot reload..."
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir src
fi

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir src
