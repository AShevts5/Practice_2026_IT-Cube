from fastapi import APIRouter, Depends

from app.dependencies import CabinetActor, CurrentTeamCaptain, CurrentTeamMember, DbSession, get_cabinet_actor
from app.schemas.team import TeamCabinetSchema, TeamUpdateSchema
from app.services.team_service import TeamService

router = APIRouter()


@router.get("/me", response_model=TeamCabinetSchema)
async def get_my_application(
    team: CurrentTeamMember,
    db: DbSession,
    actor: CabinetActor = Depends(get_cabinet_actor),
) -> TeamCabinetSchema:
    return await TeamService(db).get_cabinet(team, is_captain=actor.is_captain)


@router.patch("/me", response_model=TeamCabinetSchema)
async def update_my_application(
    body: TeamUpdateSchema,
    team: CurrentTeamCaptain,
    db: DbSession,
) -> TeamCabinetSchema:
    return await TeamService(db).update_cabinet(team, body)
