from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.enums import EventStatus
from app.db.models.team import Team
from app.db.models.track import Track
from app.schemas.event import TrackPublicSchema

async def count_teams_on_track(db: AsyncSession, track_id: int) -> int:
    result = await db.execute(select(func.count()).select_from(Team).where(Team.track_id == track_id))
    return int(result.scalar_one())

def track_registration_status(*, occupied: int, limit: int, event_open: bool) -> str:
    if not event_open:
        return "closed"
    if occupied >= limit:
        return "full"
    return "open"

async def build_track_public(
    db: AsyncSession,
    track: Track,
    *,
    event_open: bool,
) -> TrackPublicSchema:
    occupied = await count_teams_on_track(db, track.id)
    available = max(track.team_limit - occupied, 0)
    return TrackPublicSchema(
        id=track.id,
        title=track.title,
        slug=track.slug,
        description=track.description,
        team_limit=track.team_limit,
        teams_registered=occupied,
        seats_available=available,
        registration_status=track_registration_status(
            occupied=occupied,
            limit=track.team_limit,
            event_open=event_open,
        ),
    )


def is_registration_open(status: EventStatus) -> bool:
    return status == EventStatus.REGISTRATION_OPEN


PUBLIC_EVENT_STATUSES = {
    EventStatus.PUBLISHED,
    EventStatus.REGISTRATION_OPEN,
    EventStatus.REGISTRATION_CLOSED,
}
