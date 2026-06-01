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

## Запуск

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## HTTPS

```bash
apt install -y caddy
cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy
```
