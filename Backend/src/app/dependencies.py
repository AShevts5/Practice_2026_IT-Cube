from typing import Annotated
from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.models.admin_user import AdminUser
from app.db.models.team import Team
from app.db.session import get_db

DbSession = Annotated[AsyncSession, Depends(get_db)]

async def get_current_team(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> Team:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid token") from exc
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
CurrentAdmin = Annotated[AdminUser, Depends(get_current_admin)]
