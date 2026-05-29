from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.event import Event
from app.db.models.team import Team

class EventRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_slug_with_tracks(self, slug: str) -> Event | None:
        stmt = select(Event).where(Event.slug == slug).options(selectinload(Event.tracks))
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def count_teams_for_event(self, event_id: int) -> int:
        stmt = select(func.count()).select_from(Team).where(Team.event_id == event_id)
        result = await self.db.execute(stmt)
        return int(result.scalar_one())
