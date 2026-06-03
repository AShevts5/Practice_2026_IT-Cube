#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

COMPOSE=(docker compose -f docker-compose.prod.yml)
TARGET="${1:-api}"

echo "→ git pull"
git pull

run_migrations() {
  echo "→ alembic upgrade"
  "${COMPOSE[@]}" exec -T api alembic upgrade head
}

deploy_api() {
  echo "→ build & up api"
  "${COMPOSE[@]}" build api
  "${COMPOSE[@]}" up -d --no-build api
  run_migrations
}

deploy_frontend() {
  echo "→ build & up frontend"
  "${COMPOSE[@]}" build frontend
  "${COMPOSE[@]}" up -d --no-build frontend
}

case "$TARGET" in
  api)
    deploy_api
    ;;
  frontend)
    deploy_frontend
    ;;
  all)
    deploy_api
    deploy_frontend
    ;;
  *)
    echo "Usage: $0 [api|frontend|all]" >&2
    exit 1
    ;;
esac

echo "→ status"
"${COMPOSE[@]}" ps
