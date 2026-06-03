# Деплой platformhackathons.ru

## Секреты на сервере

```bash
cp .env.production.example .env
cp Backend/.env.docker.example Backend/.env.docker
nano .env
nano Backend/.env.docker
```

`SECRET_KEY`: `openssl rand -hex 32`

Первый запуск: `RUN_SEED=true` в `.env`, затем `RUN_SEED=false`.

## Первый запуск

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker compose -f docker-compose.prod.yml up --build -d
```

## Обычное обновление (быстро)

После `git pull` **не пересобирайте весь стек** — фронт на слабом VPS собирается 20–40+ минут.

```bash
cd /opt/Practice_2026_IT-Cube
chmod +x scripts/deploy-vps.sh
./scripts/deploy-vps.sh api
./scripts/deploy-vps.sh frontend
./scripts/deploy-vps.sh all
```

`deploy-vps.sh` включает BuildKit и кэш npm/pip в Dockerfile.

### Фронт: сборка на ПК (рекомендуется)

На Windows (быстрее, чем на VPS):

```powershell
cd d:\Practice_2026_IT-Cube
.\scripts\build-frontend-image.ps1 -VpsHost root@ВАШ_IP
```

На VPS:

```bash
docker load -i /tmp/org-frontend.tar
cd /opt/Practice_2026_IT-Cube
docker compose -f docker-compose.prod.yml up -d --no-build frontend
```

## Проверка типов фронта

В Docker используется `npm run build:docker` (только Vite). Перед push проверяйте локально:

```bash
cd Frontend && npm run build
```

## HTTPS

```bash
apt install -y caddy
cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy
```
