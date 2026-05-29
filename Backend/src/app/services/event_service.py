from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.db.models.enums import EventStatus
from app.db.models.event import Event
from app.db.models.team import Team
from app.db.models.track import Track
from app.schemas.event import (
    EventAdminSchema,
    EventCardSchema,
    EventCreateSchema,
    EventDetailSchema,
    EventUpdateSchema,
)
from app.services.helpers import (
    PUBLIC_EVENT_STATUSES,
    build_track_public,
    count_teams_on_track,
    is_registration_open,
)


class EventService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _total_seats_available(self, event: Event) -> int:
        total = 0
        event_open = is_registration_open(event.status)
        for track in event.tracks:
            occupied = await count_teams_on_track(self.db, track.id)
            if event_open:
                total += max(track.team_limit - occupied, 0)
        return total

    async def _to_card(self, event: Event) -> EventCardSchema:
        return EventCardSchema(
            id=event.id,
            title=event.title,
            slug=event.slug,
            description=event.description,
            status=event.status,
            registration_open=is_registration_open(event.status),
            total_seats_available=await self._total_seats_available(event),
        )

    async def _to_admin_schema(self, event: Event) -> EventAdminSchema:
        event_open = is_registration_open(event.status)
        tracks = [await build_track_public(self.db, t, event_open=event_open) for t in event.tracks]
        return EventAdminSchema(
            id=event.id,
            title=event.title,
            slug=event.slug,
            description=event.description,
            status=event.status,
            tracks=tracks,
        )

    async def _get_event_or_404(self, event_id: int) -> Event:
        stmt = select(Event).where(Event.id == event_id).options(selectinload(Event.tracks))
        result = await self.db.execute(stmt)
        event = result.scalar_one_or_none()
        if event is None:
            raise NotFoundError("Мероприятие не найдено")
        return event

    async def list_public_events(self) -> list[EventCardSchema]:
        stmt = (
            select(Event)
            .where(Event.status.in_(PUBLIC_EVENT_STATUSES))
            .options(selectinload(Event.tracks))
            .order_by(Event.created_at.desc())
        )
        result = await self.db.execute(stmt)
        events = result.scalars().all()
        return [await self._to_card(event) for event in events]

    async def get_public_event_detail(self, slug: str) -> EventDetailSchema:
        stmt = (
            select(Event)
            .where(Event.slug == slug, Event.status.in_(PUBLIC_EVENT_STATUSES))
            .options(selectinload(Event.tracks))
        )
        result = await self.db.execute(stmt)
        event = result.scalar_one_or_none()
        if event is None:
            raise NotFoundError("Мероприятие не найдено")

        card = await self._to_card(event)
        event_open = is_registration_open(event.status)
        tracks = [await build_track_public(self.db, t, event_open=event_open) for t in event.tracks]
        return EventDetailSchema(**card.model_dump(), tracks=tracks)

    async def list_admin_events(self) -> list[EventAdminSchema]:
        stmt = select(Event).options(selectinload(Event.tracks)).order_by(Event.created_at.desc())
        result = await self.db.execute(stmt)
        events = result.scalars().all()
        return [await self._to_admin_schema(event) for event in events]

    async def create_event(self, data: EventCreateSchema) -> EventAdminSchema:
        existing = await self.db.execute(select(Event).where(Event.slug == data.slug))
        if existing.scalar_one_or_none():
            raise ConflictError("Мероприятие с таким slug уже существует")

        event = Event(
            title=data.title,
            slug=data.slug,
            description=data.description,
            status=EventStatus.DRAFT,
        )
        self.db.add(event)
        await self.db.flush()

        for track_data in data.tracks:
            self.db.add(
                Track(
                    event_id=event.id,
                    title=track_data.title,
                    slug=track_data.slug,
                    description=track_data.description,
                    team_limit=track_data.team_limit,
                )
            )
        await self.db.flush()
        return await self._to_admin_schema(await self._get_event_or_404(event.id))

    async def update_event(self, event_id: int, data: EventUpdateSchema) -> EventAdminSchema:
        event = await self._get_event_or_404(event_id)

        if data.slug and data.slug != event.slug:
            dup = await self.db.execute(
                select(Event).where(Event.slug == data.slug, Event.id != event_id)
            )
            if dup.scalar_one_or_none():
                raise ConflictError("Мероприятие с таким slug уже существует")

        if data.title is not None:
            event.title = data.title
        if data.slug is not None:
            event.slug = data.slug
        if data.description is not None:
            event.description = data.description
        if data.status is not None:
            event.status = data.status

        if data.tracks is not None:
            teams_count = await self.db.execute(
                select(func.count()).select_from(Team).where(Team.event_id == event.id)
            )
            if int(teams_count.scalar_one()) > 0:
                raise ValidationError("Нельзя заменить кейсы: уже есть зарегистрированные команды")
            for track in list(event.tracks):
                await self.db.delete(track)
            await self.db.flush()
            for track_data in data.tracks:
                self.db.add(
                    Track(
                        event_id=event.id,
                        title=track_data.title,
                        slug=track_data.slug,
                        description=track_data.description,
                        team_limit=track_data.team_limit,
                    )
                )

        await self.db.flush()
        return await self._to_admin_schema(await self._get_event_or_404(event_id))

    async def finish_event(self, event_id: int) -> EventAdminSchema:
        event = await self._get_event_or_404(event_id)
        event.status = EventStatus.FINISHED
        await self.db.flush()
        return await self._to_admin_schema(event)
