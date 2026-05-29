from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession
from app.schemas.team import TeamAdminSchema, TrackStatsSchema
from app.services.team_service import TeamService

router = APIRouter()

@router.get("/events/{event_id}/stats", response_model=list[TrackStatsSchema])
async def track_statistics(
    event_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> list[TrackStatsSchema]:
    return await TeamService(db).track_stats(event_id)

@router.get("/events/{event_id}/teams", response_model=list[TeamAdminSchema])
async def list_teams(
    event_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> list[TeamAdminSchema]:
    return await TeamService(db).list_by_event(event_id)
