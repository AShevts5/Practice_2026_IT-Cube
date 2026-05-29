from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.dependencies import CurrentAdmin, DbSession
from app.services.export_service import ExportService

router = APIRouter()

@router.get("/events/{event_id}/registrations.csv")
async def export_registrations(
    event_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> StreamingResponse:
    return await ExportService(db).export_teams_csv(event_id)


@router.get("/events/{event_id}/stats.csv")
async def export_stats(
    event_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> StreamingResponse:
    return await ExportService(db).export_stats_csv(event_id)
