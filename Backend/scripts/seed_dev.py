import asyncio
from datetime import UTC, datetime

from sqlalchemy import select

from app.config import settings
from app.core.security import hash_code, hash_password
from app.db.models.admin_user import AdminUser
from app.db.models.enums import EventFormat, EventStatus
from app.db.models.event import Event
from app.db.models.invite_code import InviteCode
from app.db.models.track import Track
from app.db.session import async_session_factory

DEMO_TRACKS = [
    {
        "slug": "mts",
        "title": "Единая платформа регистрации команд на образовательные хакатоны",
        "description": (
            "МТС. Разработать веб-платформу для регистрации команд, выбора кейсов "
            "и отслеживания статуса участия в хакатонах. "
            "Технологии: React, Node.js, PostgreSQL, Redis, Docker."
        ),
        "keywords": "React, Node.js, PostgreSQL, Redis, Docker",
        "team_limit": 25,
    },
    {
        "slug": "sber",
        "title": "Цифровая образовательная среда для вузов",
        "description": (
            "СБЕР. Создать модульную LMS с треками обучения, геймификацией "
            "и аналитикой успеваемости. Технологии: Vue, Python, MongoDB."
        ),
        "keywords": "Vue, Python, MongoDB",
        "team_limit": 20,
    },
    {
        "slug": "gostech",
        "title": "Госуслуги 2.0: умный помощник гражданина",
        "description": (
            "ГОСТЕХ. Чат-бот и портал для подачи обращений в органы власти "
            "с NLP-маршрутизацией. Технологии: TypeScript, FastAPI, Kafka."
        ),
        "keywords": "TypeScript, FastAPI, Kafka",
        "team_limit": 18,
    },
    {
        "slug": "yandex",
        "title": "Аналитика городской мобильности",
        "description": (
            "ЯНДЕКС. Дашборд для транспортного департамента: тепловые карты потоков "
            "и прогноз загрузки. Технологии: React, D3.js, ClickHouse."
        ),
        "keywords": "React, D3.js, ClickHouse",
        "team_limit": 15,
    },
]

async def seed() -> None:
    async with async_session_factory() as session:
        admin_email = "admin@itcube.local"
        result = await session.execute(select(AdminUser).where(AdminUser.email == admin_email))
        if result.scalar_one_or_none() is None:
            session.add(
                AdminUser(
                    email=admin_email,
                    password_hash=hash_password("admin123"),
                    full_name="Администратор IT-Куб",
                    is_active=True,
                )
            )
            print(f"Admin created: {admin_email} / admin123")

        event_slug = "cifrovoj-proryv"
        result = await session.execute(select(Event).where(Event.slug == event_slug))
        event = result.scalar_one_or_none()
        if event is None:
            event = Event(
                title='Хакатон «Цифровой прорыв»',
                slug=event_slug,
                description=(
                    "Образовательный хакатон с кейсами от МТС, СБЕР, ГОСТЕХ и ЯНДЕКС. "
                    "Команды выбирают направление и регистрируются по коду приглашения."
                ),
                keywords=(
                    "React, TypeScript, Node.js, Python, FastAPI, PostgreSQL, Docker, JWT"
                ),
                brand="IT-КУБ",
                starts_at=datetime(2026, 6, 1, 9, 0, tzinfo=UTC),
                ends_at=datetime(2026, 6, 15, 18, 0, tzinfo=UTC),
                location="г. Москва, площадка IT-Куб",
                format=EventFormat.HYBRID,
                min_age=16,
                status=EventStatus.REGISTRATION_OPEN,
            )
            session.add(event)
            await session.flush()
            session.add_all(
                [
                    Track(
                        event_id=event.id,
                        title=track["title"],
                        slug=track["slug"],
                        description=track["description"],
                        keywords=track["keywords"],
                        team_limit=track["team_limit"],
                    )
                    for track in DEMO_TRACKS
                ]
            )
            await session.flush()
            session.add(
                InviteCode(
                    event_id=event.id,
                    code_hash=hash_code("DEMO2026"),
                    label="demo",
                )
            )
            print(f"Event created: {event_slug}, invite code: DEMO2026")
            for track in DEMO_TRACKS:
                print(f"  - {track['slug']}: {track['title']} (limit {track['team_limit']})")
        elif not event.keywords:
            event.keywords = (
                "React, TypeScript, Node.js, Python, FastAPI, PostgreSQL, Docker, JWT"
            )
            event.brand = event.brand or "IT-КУБ"
            event.starts_at = event.starts_at or datetime(2026, 6, 1, 9, 0, tzinfo=UTC)
            event.ends_at = event.ends_at or datetime(2026, 6, 15, 18, 0, tzinfo=UTC)
            if not event.location:
                event.location = "г. Москва, площадка IT-Куб"
            if event.format is None:
                event.format = EventFormat.HYBRID
            if event.min_age is None:
                event.min_age = 16
            print(f"Event metadata updated: {event_slug}")

        if event is not None:
            demo_by_slug = {track["slug"]: track for track in DEMO_TRACKS}
            tracks_result = await session.execute(
                select(Track).where(Track.event_id == event.id)
            )
            for track in tracks_result.scalars().all():
                demo = demo_by_slug.get(track.slug)
                if demo and not track.keywords:
                    track.keywords = demo["keywords"]

        await session.commit()
    print("Seed completed. DATABASE_URL:", settings.database_url)

if __name__ == "__main__":
    asyncio.run(seed())
