import csv
import io

from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.db.models.event import Event
from app.db.models.team import Team
from app.services.team_service import TeamService


class ExportService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _ensure_event(self, event_id: int) -> Event:
        event = await self.db.get(Event, event_id)
        if event is None:
            raise NotFoundError("Мероприятие не найдено")
        return event

    async def export_teams_csv(self, event_id: int) -> StreamingResponse:
        await self._ensure_event(event_id)
        stmt = (
            select(Team)
            .where(Team.event_id == event_id)
            .options(selectinload(Team.track))
            .order_by(Team.id)
        )
        teams = (await self.db.execute(stmt)).scalars().all()

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(
            ["id", "team_name", "captain_full_name", "email", "phone", "track", "login", "created_at"]
        )
        for team in teams:
            writer.writerow(
                [
                    team.id,
                    team.name,
                    team.captain_full_name,
                    team.email,
                    team.phone,
                    team.track.title,
                    team.login,
                    team.created_at.isoformat(),
                ]
            )

        buffer.seek(0)
        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="event_{event_id}_teams.csv"'},
        )

    async def export_stats_csv(self, event_id: int) -> StreamingResponse:
        stats = await TeamService(self.db).track_stats(event_id)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["track_id", "track_title", "limit", "occupied", "available", "status"])
        for row in stats:
            writer.writerow(
                [row.track_id, row.track_title, row.limit, row.occupied, row.available, row.status]
            )
        buffer.seek(0)
        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="event_{event_id}_stats.csv"'},
        )
