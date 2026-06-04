# IT-Cube Platform (platformhackathons.ru)

Платформа регистрации команд на хакатоны и мероприятия.  
Бэкенд на **FastAPI + PostgreSQL**, фронтенд на **React + Vite**, деплой через **Docker Compose**.

Продакшен: [https://platformhackathons.ru](https://platformhackathons.ru)  
Подробный деплой на VPS: [DEPLOY.md](./DEPLOY.md)

## Возможности

- Публичный каталог мероприятий и кейсов (треков)
- Регистрация команд с инвайт-кодами
- Роли: гость, капитан, команда, администратор
- Вход с OTP по email (капитан, админ, команда)
- OAuth (GitHub, Yandex) для капитанов
- Восстановление пароля по email
- Личный кабинет команды: профиль, смена кейса, материалы, чаты
- Панель администратора: мероприятия, кейсы, инвайты, команды, экспорт CSV
- AI-помощник на сайте (OpenAI-совместимый API + история в PostgreSQL)
- PWA, тёмная тема
- OpenAPI-схема и типизированный клиент на фронте

## Стек

| Слой | Технологии |
|------|------------|
| API | FastAPI, SQLAlchemy 2 (async), Alembic, Pydantic |
| БД | PostgreSQL 16, Redis |
| Auth | JWT, bcrypt, OTP, OAuth 2.0 |
| Почта | SMTP (aiosmtplib), SMS-провайдер (mock)|
| LLM | httpx → Chat Completions API |
| Frontend | React 19, TypeScript, Vite, TanStack Query, React Router, Tailwind, shadcn/ui |
| Прод | Docker, nginx, Caddy (HTTPS) |

## Структура проекта

```
Practice_2026_IT-Cube/
├── Backend/                      ← API (FastAPI)
│   ├── src/app/
│   │   ├── api/v1/               ← REST: public, auth, admin, team, registration
│   │   ├── services/             ← бизнес-логика
│   │   ├── db/models/            ← ORM-модели
│   │   ├── integrations/         ← email, SMS, OAuth, LLM
│   │   ├── schemas/              ← Pydantic-схемы
│   │   └── main.py               ← приложение FastAPI
│   ├── alembic/versions/         ← миграции БД
│   ├── scripts/                  ← seed, create_admin, test_smtp, backup
│   ├── docker-entrypoint.sh      ← миграции + запуск uvicorn
│   ├── Dockerfile
│   └── requirements.txt
│
├── Frontend/                     ← SPA (Vite)
│   ├── src/
│   │   ├── app/                  ← router, providers
│   │   ├── features/             ← страницы и фичи (auth, cabinet, admin, ai-chat…)
│   │   └── shared/               ← API, UI-kit, конфиг, маршруты
│   ├── docker/nginx/             ← прокси /api/v1 → api
│   ├── Dockerfile
│   └── package.json
│
├── scripts/
│   ├── deploy-vps.sh             ← деплой на VPS (api / frontend / all)
│   └── build-frontend-image.ps1  ← сборка фронта на Windows → scp на сервер
│
├── deploy/Caddyfile              ← HTTPS для прода
├── docker-compose.yml            ← локальная разработка
├── docker-compose.prod.yml       ← продакшен
├── DEPLOY.md                     ← инструкции деплоя
└── README.md
```

## Установка и настройка

### 1. Клонирование

```bash
git clone https://github.com/AShevts5/Practice_2026_IT-Cube.git
cd Practice_2026_IT-Cube
```

### 2. Переменные окружения

**Локально (Docker):**

```bash
cp Backend/.env.docker.example Backend/.env.docker
# при необходимости отредактировать Backend/.env.docker
```

**Продакшен:** см. [DEPLOY.md](./DEPLOY.md) — файлы `.env` (корень) и `Backend/.env.docker` (секреты, SMTP, OAuth, LLM).

**Фронт (опционально, чаты в кабинете):** в корневом `.env` или при сборке образа:

```env
VITE_HACKATHON_CHAT_URL=https://t.me/your_hackathon_chat
VITE_MENTORS_CHAT_URL=https://t.me/your_mentors_chat
```

### 3. Зависимости (без Docker)

**Бэкенд:**

```bash
cd Backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

**Фронтенд:**

```bash
cd Frontend
npm ci
```

## Запуск

### Вариант A — Docker (рекомендуется локально)

```powershell
# Windows
cd Practice_2026_IT-Cube
$env:DOCKER_BUILDKIT = "1"
docker compose up --build -d
docker compose ps
```

```bash
# Linux / macOS
cd Practice_2026_IT-Cube
export DOCKER_BUILDKIT=1
docker compose up --build -d
```

| Сервис | URL |
|--------|-----|
| Сайт | http://localhost:4173 |
| API | http://localhost:8000 |
| Swagger (DEBUG=true) | http://localhost:8000/docs |
| Mailpit (почта dev) | http://localhost:8025 |

Остановка: `docker compose down`

### Вариант B — API и фронт отдельно

Терминал 1 — инфраструктура и API:

```bash
docker compose up -d db redis mailpit api
```

Терминал 2 — фронт:

```bash
cd Frontend
npm run dev
```

Сайт: http://localhost:5173 (прокси `/api/v1` → API в `vite.config.ts`)

### Продакшен (VPS)

Кратко:

```bash
cd /opt/Practice_2026_IT-Cube
git pull origin main
./scripts/deploy-vps.sh api      # или frontend / all
```

Полная схема, секреты и быстрая сборка фронта с ПК — в [DEPLOY.md](./DEPLOY.md).

## Скрипты

| Команда | Где | Назначение |
|---------|-----|------------|
| `docker compose up --build -d` | корень | локальный стек |
| `cd Frontend && npm run dev` | Frontend | dev-сервер Vite |
| `cd Frontend && npm run build` | Frontend | проверка типов + production build |
| `cd Frontend && npm run api` | Frontend | генерация TS из OpenAPI |
| `cd Backend && alembic upgrade head` | Backend | миграции БД |
| `python scripts/create_admin.py` | в контейнере api | создать администратора |
| `./scripts/deploy-vps.sh api` | VPS | деплой API |
| `.\scripts\build-frontend-image.ps1` | Windows | образ фронта → VPS |

## Конфигурация (Backend)

Основные переменные в `Backend/.env.docker`:

| Переменная | Описание |
|------------|----------|
| `SECRET_KEY` | JWT и токены сброса пароля (≥32 символа) |
| `DATABASE_URL` | задаётся в compose для контейнера |
| `SMTP_*` | отправка OTP и писем восстановления пароля |
| `FRONTEND_BASE_URL` | ссылки в email (прод: `https://platformhackathons.ru`) |
| `OAUTH_*` / `GITHUB_*` / `YANDEX_*` / `VK_*` | OAuth для капитанов |
| `LLM_ENABLED`, `LLM_API_KEY`, `LLM_MODEL` | AI-помощник |
| `AI_CHAT_GREETING` | приветствие в виджете чата |

Полные примеры: `Backend/.env.example`, `Backend/.env.docker.example`, `.env.production.example`.

## API (основные группы)

Префикс: `/api/v1`

**Публичное**

- `GET /public/events` — список мероприятий
- `GET /public/events/{slug}` — карточка и кейсы
- `POST /public/ai-chat/sessions` — старт AI-чата
- `POST /public/ai-chat/sessions/{id}/messages` — сообщение в чат

**Аутентификация**

- `POST /auth/captain/register`, `/auth/captain/login`, OTP
- `POST /auth/team/login`, OTP
- `POST /auth/admin/login`, OTP
- `GET /auth/oauth/{provider}/authorize`, callback, `POST /auth/oauth/complete`
- `POST /auth/forgot-password`, `POST /auth/reset-password/{token}`

**Кабинет и регистрация**

- `POST /registration/events/{slug}/teams` — регистрация команды
- `GET/PATCH /team/me` — кабинет команды
- `GET /captain/me` — профиль капитана

**Админ** (Bearer, role=admin)

- `CRUD /admin/events`, инвайты, команды, `GET .../registrations.csv`

Актуальная схема: `Frontend/src/shared/api/schema/main.yaml` → `npm run api` в `Frontend/`.

## Документация в репозитории

| Файл | Содержание |
|------|------------|
| [README.md](./README.md) | обзор проекта (этот файл) |
| [DEPLOY.md](./DEPLOY.md) | деплой на VPS, секреты, сценарии обновления |

## Команда

**Команда «Пламенный свет»** — platformhackathons.ru, 2026.
