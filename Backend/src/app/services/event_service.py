from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.db.models.enums import EventStatus
from app.db.models.event import Event
from app.db.models.track import Track
from app.schemas.event import (
    EventAdminSchema,
    EventCardSchema,
    EventCreateSchema,
    EventDetailSchema,
    EventUpdateSchema,
    TrackUpsertSchema,
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

    async def _seat_totals(self, event: Event) -> tuple[int, int, int]:
        available = 0
        registered = 0
        limit = 0
        event_open = is_registration_open(event.status)
        for track in event.tracks:
            occupied = await count_teams_on_track(self.db, track.id)
            limit += track.team_limit
            registered += occupied
            if event_open:
                available += max(track.team_limit - occupied, 0)
        return available, registered, limit

    async def _to_card(self, event: Event) -> EventCardSchema:
        available, registered, limit = await self._seat_totals(event)
        return EventCardSchema(
            id=event.id,
            title=event.title,
            slug=event.slug,
            description=event.description,
            keywords=event.keywords,
            brand=event.brand,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            location=event.location,
            format=event.format,
            min_age=event.min_age,
            status=event.status,
            registration_open=is_registration_open(event.status),
            total_seats_available=available,
            total_seats_limit=limit,
            total_teams_registered=registered,
        )

    async def _to_admin_schema(self, event: Event) -> EventAdminSchema:
        event_open = is_registration_open(event.status)
        tracks = [await build_track_public(self.db, t, event_open=event_open) for t in event.tracks]
        return EventAdminSchema(
            id=event.id,
            title=event.title,
            slug=event.slug,
            description=event.description,
            keywords=event.keywords,
            brand=event.brand,
            starts_at=event.starts_at,
            ends_at=event.ends_at,
            location=event.location,
            format=event.format,
            min_age=event.min_age,
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
            keywords=data.keywords,
            brand=data.brand,
            starts_at=data.starts_at,
            ends_at=data.ends_at,
            location=data.location,
            format=data.format,
            min_age=data.min_age,
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
                    keywords=track_data.keywords,
                    team_limit=track_data.team_limit,
                )
            )
        await self.db.flush()
        return await self._to_admin_schema(await self._get_event_or_404(event.id))

    async def _sync_event_tracks(
        self,
        event: Event,
        tracks_data: list[TrackUpsertSchema],
    ) -> None:
        if not tracks_data:
            raise ValidationError("Добавьте хотя бы один кейс")

        existing = {track.id: track for track in event.tracks}
        kept_ids: set[int] = set()

        for track_data in tracks_data:
            slug = track_data.slug.strip()
            title = track_data.title.strip()
            if not title or not slug:
                raise ValidationError("У каждого кейса должны быть название и slug")

            if track_data.id is not None:
                track = existing.get(track_data.id)
                if track is None:
                    raise ValidationError(f"Кейс с id={track_data.id} не найден")

                occupied = await count_teams_on_track(self.db, track.id)
                if track_data.team_limit < occupied:
                    raise ValidationError(
                        f"Лимит кейса «{track.title}» не может быть меньше числа команд ({occupied})"
                    )

                dup = await self.db.execute(
                    select(Track).where(
                        Track.event_id == event.id,
                        Track.slug == slug,
                        Track.id != track.id,
                    )
                )
                if dup.scalar_one_or_none():
                    raise ValidationError(f"Кейс со slug «{slug}» уже существует")

                track.title = title
                track.slug = slug
                track.description = track_data.description
                track.keywords = track_data.keywords
                track.team_limit = track_data.team_limit
                kept_ids.add(track.id)
                continue

            dup = await self.db.execute(
                select(Track).where(Track.event_id == event.id, Track.slug == slug)
            )
            if dup.scalar_one_or_none():
                raise ValidationError(f"Кейс со slug «{slug}» уже существует")

            new_track = Track(
                event_id=event.id,
                title=title,
                slug=slug,
                description=track_data.description,
                keywords=track_data.keywords,
                team_limit=track_data.team_limit,
            )
            self.db.add(new_track)
            await self.db.flush()
            kept_ids.add(new_track.id)

        for track_id, track in existing.items():
            if track_id in kept_ids:
                continue
            occupied = await count_teams_on_track(self.db, track_id)
            if occupied > 0:
                raise ValidationError(
                    f"Нельзя удалить кейс «{track.title}»: есть зарегистрированные команды"
                )
            await self.db.delete(track)

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
        if data.keywords is not None:
            event.keywords = data.keywords
        if data.brand is not None:
            event.brand = data.brand
        if "starts_at" in data.model_fields_set:
            event.starts_at = data.starts_at
        if "ends_at" in data.model_fields_set:
            event.ends_at = data.ends_at
        if data.location is not None:
            event.location = data.location
        if "format" in data.model_fields_set:
            event.format = data.format
        if "min_age" in data.model_fields_set:
            event.min_age = data.min_age
        if data.status is not None:
            event.status = data.status

        if data.tracks is not None:
            await self._sync_event_tracks(event, data.tracks)

        await self.db.flush()
        return await self._to_admin_schema(await self._get_event_or_404(event_id))

    async def finish_event(self, event_id: int) -> EventAdminSchema:
        event = await self._get_event_or_404(event_id)
        event.status = EventStatus.FINISHED
        await self.db.flush()
        return await self._to_admin_schema(event)

    async def delete_event(self, event_id: int) -> None:
        event = await self._get_event_or_404(event_id)
        teams_count = 0
        for track in event.tracks:
            teams_count += await count_teams_on_track(self.db, track.id)
        if teams_count > 0:
            raise ValidationError(
                "Нельзя удалить мероприятие: есть зарегистрированные команды"
            )
        await self.db.delete(event)
        await self.db.flush()

    async def delete_track(self, event_id: int, track_id: int) -> EventAdminSchema:
        event = await self._get_event_or_404(event_id)
        track = next((item for item in event.tracks if item.id == track_id), None)
        if track is None:
            raise NotFoundError("Кейс не найден")

        occupied = await count_teams_on_track(self.db, track_id)
        if occupied > 0:
            raise ValidationError(
                f"Нельзя удалить кейс «{track.title}»: есть зарегистрированные команды"
            )

        if len(event.tracks) <= 1:
            raise ValidationError("У мероприятия должен остаться хотя бы один кейс")

        await self.db.delete(track)
        await self.db.flush()
        return await self._to_admin_schema(await self._get_event_or_404(event_id))
