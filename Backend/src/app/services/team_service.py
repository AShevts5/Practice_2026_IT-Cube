from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ValidationError
from app.db.models.event import Event
from app.db.models.team import Team
from app.db.models.track import Track
from app.schemas.team import TeamAdminSchema, TeamCabinetSchema, TeamUpdateSchema, TrackStatsSchema
from app.services.helpers import count_teams_on_track, is_registration_open


class TeamService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_cabinet(self, team: Team) -> TeamCabinetSchema:
        stmt = (
            select(Team)
            .where(Team.id == team.id)
            .options(selectinload(Team.event), selectinload(Team.track))
        )
        result = await self.db.execute(stmt)
        full_team = result.scalar_one()
        return TeamCabinetSchema(
            id=full_team.id,
            team_name=full_team.name,
            captain_full_name=full_team.captain_full_name,
            email=full_team.email,
            phone=full_team.phone,
            event_title=full_team.event.title,
            event_slug=full_team.event.slug,
            track_title=full_team.track.title,
            track_id=full_team.track_id,
        )

    async def update_cabinet(self, team: Team, data: TeamUpdateSchema) -> TeamCabinetSchema:
        stmt = (
            select(Team)
            .where(Team.id == team.id)
            .options(selectinload(Team.event), selectinload(Team.track))
        )
        result = await self.db.execute(stmt)
        current = result.scalar_one()

        if data.team_name is not None:
            dup = await self.db.execute(
                select(Team).where(
                    Team.event_id == current.event_id,
                    Team.name == data.team_name,
                    Team.id != current.id,
                )
            )
            if dup.scalar_one_or_none():
                raise ValidationError("Команда с таким названием уже существует")
            current.name = data.team_name

        if data.captain_full_name is not None:
            current.captain_full_name = data.captain_full_name
        if data.email is not None:
            current.email = str(data.email).lower()
        if data.phone is not None:
            current.phone = data.phone

        if data.track_id is not None and data.track_id != current.track_id:
            if not is_registration_open(current.event.status):
                raise ValidationError("Смена кейса недоступна: регистрация закрыта")
            track_result = await self.db.execute(
                select(Track).where(Track.id == data.track_id, Track.event_id == current.event_id)
            )
            new_track = track_result.scalar_one_or_none()
            if new_track is None:
                raise ValidationError("Кейс не найден")
            occupied = await count_teams_on_track(self.db, new_track.id)
            if occupied >= new_track.team_limit:
                raise ValidationError("На выбранном кейсе нет свободных мест")
            current.track_id = new_track.id

        await self.db.flush()
        return await self.get_cabinet(current)

    async def track_stats(self, event_id: int) -> list[TrackStatsSchema]:
        event = await self.db.get(Event, event_id)
        if event is None:
            raise NotFoundError("Мероприятие не найдено")

        stmt = select(Track).where(Track.event_id == event_id).order_by(Track.id)
        tracks = (await self.db.execute(stmt)).scalars().all()
        event_open = is_registration_open(event.status)
        stats: list[TrackStatsSchema] = []
        for track in tracks:
            occupied = await count_teams_on_track(self.db, track.id)
            available = max(track.team_limit - occupied, 0)
            if not event_open:
                status = "closed"
            elif available == 0:
                status = "full"
            else:
                status = "open"
            stats.append(
                TrackStatsSchema(
                    track_id=track.id,
                    track_title=track.title,
                    limit=track.team_limit,
                    occupied=occupied,
                    available=available,
                    status=status,
                )
            )
        return stats

    async def list_by_event(self, event_id: int) -> list[TeamAdminSchema]:
        stmt = (
            select(Team)
            .where(Team.event_id == event_id)
            .options(selectinload(Team.track))
            .order_by(Team.created_at.desc())
        )
        teams = (await self.db.execute(stmt)).scalars().all()
        return [
            TeamAdminSchema(
                id=t.id,
                name=t.name,
                captain_full_name=t.captain_full_name,
                email=t.email,
                phone=t.phone,
                track_title=t.track.title,
                created_at=t.created_at.isoformat(),
            )
            for t in teams
        ]
