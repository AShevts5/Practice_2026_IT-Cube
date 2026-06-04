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

wait_api_healthy() {
  local i
  for i in $(seq 1 45); do
    if "${COMPOSE[@]}" exec -T api curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "API unhealthy" >&2
  "${COMPOSE[@]}" logs api --tail 40
  return 1
}

run_migrations() {
  echo "→ alembic upgrade"
  "${COMPOSE[@]}" exec -T api alembic upgrade head
}

deploy_api() {
  sed -i 's/\r$//' Backend/docker-entrypoint.sh 2>/dev/null || true
  echo "→ build & up api"
  "${COMPOSE[@]}" build api
  "${COMPOSE[@]}" up -d --no-build --force-recreate api
  wait_api_healthy
  run_migrations
}

deploy_frontend() {
  echo "→ build & up frontend"
  "${COMPOSE[@]}" build frontend
  if ! "${COMPOSE[@]}" ps --status running 2>/dev/null | grep -q itcube-api; then
    deploy_api
  else
    wait_api_healthy || deploy_api
  fi
  "${COMPOSE[@]}" up -d --no-build --force-recreate frontend
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
