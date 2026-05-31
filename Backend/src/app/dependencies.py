from dataclasses import dataclass
from typing import Annotated
from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.models.captain import Captain
from app.db.models.admin_user import AdminUser
from app.db.models.team import Team
from app.db.session import get_db

DbSession = Annotated[AsyncSession, Depends(get_db)]


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token")
    return authorization.split(" ", 1)[1]


def _decode_role_token(authorization: str | None) -> dict[str, str]:
    token = _extract_bearer_token(authorization)
    try:
        return decode_access_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token") from exc


@dataclass(frozen=True)
class CabinetActor:
    team: Team
    is_captain: bool

async def get_cabinet_actor(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> CabinetActor:
    payload = _decode_role_token(authorization)
    role = payload["role"]

    if role == "team":
        result = await db.execute(select(Team).where(Team.id == int(payload["sub"])))
        team = result.scalar_one_or_none()
        if team is None:
            raise UnauthorizedError("Team not found")
        return CabinetActor(team=team, is_captain=False)

    if role == "captain":
        result = await db.execute(
            select(Captain).where(Captain.id == int(payload["sub"]), Captain.is_active.is_(True))
        )
        captain = result.scalar_one_or_none()
        if captain is None:
            raise UnauthorizedError("Captain not found")
        if captain.team_id is None:
            raise ForbiddenError("У капитана нет зарегистрированной команды")
        team_result = await db.execute(select(Team).where(Team.id == captain.team_id))
        team = team_result.scalar_one_or_none()
        if team is None:
            raise UnauthorizedError("Team not found")
        return CabinetActor(team=team, is_captain=True)

    raise ForbiddenError("Team or captain role required")


async def get_current_team_member(
    actor: Annotated[CabinetActor, Depends(get_cabinet_actor)],
) -> Team:
    return actor.team


async def get_current_team_captain(
    actor: Annotated[CabinetActor, Depends(get_cabinet_actor)],
) -> Team:
    if not actor.is_captain:
        raise ForbiddenError("Только капитан может изменять данные команды")
    return actor.team


async def get_current_team(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> Team:
    payload = _decode_role_token(authorization)
    if payload["role"] != "team":
        raise ForbiddenError("Team role required")
    result = await db.execute(select(Team).where(Team.id == int(payload["sub"])))
    team = result.scalar_one_or_none()
    if team is None:
        raise UnauthorizedError("Team not found")
    return team


async def get_current_admin(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> AdminUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token") from exc
    if payload["role"] != "admin":
        raise ForbiddenError("Admin role required")
    result = await db.execute(
        select(AdminUser).where(AdminUser.id == int(payload["sub"]), AdminUser.is_active.is_(True))
    )
    admin = result.scalar_one_or_none()
    if admin is None:
        raise UnauthorizedError("Admin not found")
    return admin

CurrentTeam = Annotated[Team, Depends(get_current_team)]
CurrentTeamMember = Annotated[Team, Depends(get_current_team_member)]
CurrentTeamCaptain = Annotated[Team, Depends(get_current_team_captain)]
CurrentAdmin = Annotated[AdminUser, Depends(get_current_admin)]


async def get_current_captain(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> Captain:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token") from exc
    if payload["role"] != "captain":
        raise ForbiddenError("Captain role required")
    result = await db.execute(
        select(Captain).where(Captain.id == int(payload["sub"]), Captain.is_active.is_(True))
    )
    captain = result.scalar_one_or_none()
    if captain is None:
        raise UnauthorizedError("Captain not found")
    return captain


CurrentCaptain = Annotated[Captain, Depends(get_current_captain)]
