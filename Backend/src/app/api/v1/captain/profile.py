from fastapi import APIRouter

from app.dependencies import CurrentCaptain, DbSession
from app.schemas.captain import CaptainProfileSchema
from app.services.captain_service import CaptainService

router = APIRouter()


@router.get("/me", response_model=CaptainProfileSchema)
async def get_captain_profile(
    captain: CurrentCaptain,
    db: DbSession,
) -> CaptainProfileSchema:
    return await CaptainService(db).get_profile(captain)
