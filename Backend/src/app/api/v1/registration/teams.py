from fastapi import APIRouter

from app.dependencies import CurrentCaptain, DbSession
from app.schemas.registration import RegistrationRequest, RegistrationResponse
from app.services.registration_service import RegistrationService

router = APIRouter()


@router.post("/events/{event_slug}/teams", response_model=RegistrationResponse)
async def register_team(
    event_slug: str,
    body: RegistrationRequest,
    captain: CurrentCaptain,
    db: DbSession,
) -> RegistrationResponse:
    return await RegistrationService(db).register_team(event_slug, captain, body)
