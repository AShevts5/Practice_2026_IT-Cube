import asyncio
from sqlalchemy import select

from app.config import settings
from app.core.security import hash_code, hash_password
from app.db.models.admin_user import AdminUser
from app.db.models.enums import EventStatus
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
        "team_limit": 25,
    },
    {
        "slug": "sber",
        "title": "Цифровая образовательная среда для вузов",
        "description": (
            "СБЕР. Создать модульную LMS с треками обучения, геймификацией "
            "и аналитикой успеваемости. Технологии: Vue, Python, MongoDB."
        ),
        "team_limit": 20,
    },
    {
        "slug": "gostech",
        "title": "Госуслуги 2.0: умный помощник гражданина",
        "description": (
            "ГОСТЕХ. Чат-бот и портал для подачи обращений в органы власти "
            "с NLP-маршрутизацией. Технологии: TypeScript, FastAPI, Kafka."
        ),
        "team_limit": 18,
    },
    {
        "slug": "yandex",
        "title": "Аналитика городской мобильности",
        "description": (
            "ЯНДЕКС. Дашборд для транспортного департамента: тепловые карты потоков "
            "и прогноз загрузки. Технологии: React, D3.js, ClickHouse."
        ),
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

        await session.commit()
    print("Seed completed. DATABASE_URL:", settings.database_url)

if __name__ == "__main__":
    asyncio.run(seed())
