from fastapi import APIRouter

from app.dependencies import CurrentTeam, DbSession
from app.schemas.team import TeamCabinetSchema, TeamUpdateSchema
from app.services.team_service import TeamService

router = APIRouter()

@router.get("/me", response_model=TeamCabinetSchema)
async def get_my_application(team: CurrentTeam, db: DbSession) -> TeamCabinetSchema:
    return await TeamService(db).get_cabinet(team)

@router.patch("/me", response_model=TeamCabinetSchema)
async def update_my_application(
    body: TeamUpdateSchema,
    team: CurrentTeam,
    db: DbSession,
) -> TeamCabinetSchema:
    return await TeamService(db).update_cabinet(team, body)
