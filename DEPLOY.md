# Деплой platformhackathons.ru

Прод: Docker Compose (`docker-compose.prod.yml`), каталог на VPS — `/opt/Practice_2026_IT-Cube`.

| Сервис | Роль |
|--------|------|
| `db` | PostgreSQL |
| `redis` | Redis |
| `api` | FastAPI |
| `frontend` | nginx + статика Vite |

Перед деплоем на VPS всегда делайте `git push` с ПК. На сервере — `git pull` (входит в `scripts/deploy-vps.sh`).

Переменные для ускорения сборки (на VPS):

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

---

## Секреты (один раз)

```bash
cd /opt/Practice_2026_IT-Cube
cp .env.production.example .env
cp Backend/.env.docker.example Backend/.env.docker
nano .env
nano Backend/.env.docker
```

`SECRET_KEY`: `openssl rand -hex 32`

Первый запуск с демо-данными: `RUN_SEED=true` в `.env`, после — `RUN_SEED=false`.

---

## 0. Перед любым деплоем (ПК)

```powershell
cd d:\Practice_2026_IT-Cube

git status

git add -A
git commit -m "Ваше сообщение коммита"
git push origin main
```

Если менялся фронт — проверка типов:

```powershell
cd d:\Practice_2026_IT-Cube\Frontend
npm run build
```

В Docker на VPS для фронта используется `npm run build:docker` (только Vite, без `tsc`). Полная проверка типов — на ПК.

---

## 1. Только бэкенд (API + миграции)

**Когда:** изменения в `Backend/`, фронт не менялся.

**На VPS:**

```bash
cd /opt/Practice_2026_IT-Cube

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

chmod +x scripts/deploy-vps.sh

./scripts/deploy-vps.sh api
```

Скрипт выполняет: `git pull` → сборка `api` → `up -d` → `alembic upgrade head`.

**Проверка:**

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs api --tail 50
curl -s http://127.0.0.1:8000/health
```

---

## 2. Только фронт (сборка на VPS)

**Когда:** изменения в `Frontend/`, бэкенд не менялся.

**На ПК:** раздел 0 (`git push`).

**На VPS:**

```bash
cd /opt/Practice_2026_IT-Cube

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

chmod +x scripts/deploy-vps.sh

./scripts/deploy-vps.sh frontend
```

**Проверка:**

```bash
docker compose -f docker-compose.prod.yml ps
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

---

## 3. Фронт с ПК (быстрее, чем сборка на VPS)

**Когда:** обновили фронт и не хотите долго собирать на слабом сервере.

**Шаг 1 — ПК:**

```powershell
cd d:\Practice_2026_IT-Cube

git push origin main

.\scripts\build-frontend-image.ps1 -VpsHost root@168.222.140.209
```

Скрипт: `docker build` → `docker save` → `scp` в `/tmp/org-frontend.tar` на VPS.

**Шаг 2 — VPS:**

```bash
docker load -i /tmp/org-frontend.tar

cd /opt/Practice_2026_IT-Cube

git pull

docker compose -f docker-compose.prod.yml up -d --no-build frontend
```

**Проверка:**

```bash
docker compose -f docker-compose.prod.yml ps
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

---

## 4. Всё сразу (API + фронт на VPS)

**Когда:** меняли и бэкенд, и фронт.

**На ПК:** раздел 0, при желании `npm run build` в `Frontend`.

**На VPS:**

```bash
cd /opt/Practice_2026_IT-Cube

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

chmod +x scripts/deploy-vps.sh

./scripts/deploy-vps.sh all
```

Порядок: API + миграции, затем frontend.

**Проверка:**

```bash
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:8000/health
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

---

## 5. Бэкенд на VPS + фронт с ПК (оптимально)

**Когда:** полное обновление без долгой сборки фронта на VPS.

**На ПК:**

```powershell
cd d:\Practice_2026_IT-Cube
git push origin main
cd Frontend
npm run build
cd ..
.\scripts\build-frontend-image.ps1 -VpsHost root@168.222.140.209
```

**На VPS:**

```bash
cd /opt/Practice_2026_IT-Cube

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

chmod +x scripts/deploy-vps.sh

./scripts/deploy-vps.sh api

docker load -i /tmp/org-frontend.tar

docker compose -f docker-compose.prod.yml up -d --no-build frontend

docker compose -f docker-compose.prod.yml ps
```

---

## 6. Первый запуск / всё с нуля

**Когда:** сервер настраивается впервые.

**Секреты:** блок «Секреты (один раз)» выше.

**Запуск:**

```bash
cd /opt/Practice_2026_IT-Cube

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

docker compose -f docker-compose.prod.yml up --build -d
```

**Проверка:**

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec api alembic current
curl -s http://127.0.0.1:8000/health
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

**HTTPS (Caddy):**

```bash
apt install -y caddy
cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl enable --now caddy
systemctl reload caddy
```

---

## 7. Аварийно: поднять без пересборки

**Когда:** сборка зависла или прервалась, образы уже собраны.

```bash
cd /opt/Practice_2026_IT-Cube

docker compose -f docker-compose.prod.yml up -d --no-build db redis api frontend

docker compose -f docker-compose.prod.yml ps
```

---

## Шпаргалка

| Сценарий | ПК | VPS |
|----------|----|-----|
| Только API | `git push` | `./scripts/deploy-vps.sh api` |
| Только UI (VPS) | `git push` | `./scripts/deploy-vps.sh frontend` |
| Только UI (ПК) | `build-frontend-image.ps1` | `docker load` + `up -d --no-build frontend` |
| Всё на VPS | `git push` | `./scripts/deploy-vps.sh all` |
| Всё оптимально | `git push` + `build-frontend-image.ps1` | `deploy-vps.sh api` + `docker load` + `up frontend` |
| Первый запуск | — | `docker compose ... up --build -d` |
| Без сборки | — | `up -d --no-build` |

**Не использовать для обычных обновлений** (долго, собирает всё):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Скрипты

| Файл | Где запускать | Назначение |
|------|---------------|------------|
| `scripts/deploy-vps.sh` | VPS | `api` / `frontend` / `all` |
| `scripts/build-frontend-image.ps1` | Windows | Сборка образа фронта и загрузка на VPS |

Пример:

```bash
./scripts/deploy-vps.sh api
./scripts/deploy-vps.sh frontend
./scripts/deploy-vps.sh all
```
