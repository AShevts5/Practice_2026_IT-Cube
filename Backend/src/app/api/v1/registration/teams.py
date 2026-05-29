from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.registration import RegistrationRequest, RegistrationResponse
from app.services.registration_service import RegistrationService

router = APIRouter()

@router.post("/events/{event_slug}/teams", response_model=RegistrationResponse)
async def register_team(
    event_slug: str,
    body: RegistrationRequest,
    db: AsyncSession = Depends(get_db),
) -> RegistrationResponse:
    return await RegistrationService(db).register_team(event_slug, body)
