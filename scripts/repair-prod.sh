#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

COMPOSE=(docker compose -f docker-compose.prod.yml)

wait_api_healthy() {
  local i
  for i in $(seq 1 45); do
    if "${COMPOSE[@]}" exec -T api curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "API не прошёл healthcheck" >&2
  "${COMPOSE[@]}" logs api --tail 40
  return 1
}

echo "→ проверка .env.docker"
if grep -qE '^DATABASE_URL=' Backend/.env.docker 2>/dev/null; then
  echo "Удалите DATABASE_URL из Backend/.env.docker (должен быть только хост db из compose)" >&2
  exit 1
fi

echo "→ CRLF в entrypoint"
sed -i 's/\r$//' Backend/docker-entrypoint.sh

echo "→ db + redis"
"${COMPOSE[@]}" up -d db redis

echo "→ build + up api"
"${COMPOSE[@]}" build api
"${COMPOSE[@]}" up -d --no-build --force-recreate api

echo "→ ожидание API"
wait_api_healthy

echo "→ frontend"
"${COMPOSE[@]}" up -d --no-build --force-recreate frontend

echo "→ status"
"${COMPOSE[@]}" ps
curl -sf http://127.0.0.1:8000/health && echo ""
curl -s -o /dev/null -w "frontend HTTP %{http_code}\n" http://127.0.0.1:8080/
