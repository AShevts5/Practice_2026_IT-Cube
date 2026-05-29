from fastapi import APIRouter
from app.api.v1.admin import events as admin_events
from app.api.v1.admin import export as admin_export
from app.api.v1.admin import invites as admin_invites
from app.api.v1.admin import teams as admin_teams
from app.api.v1.auth import admin as auth_admin
from app.api.v1.auth import team as auth_team
from app.api.v1.public import events as public_events
from app.api.v1.registration import teams as registration
from app.api.v1.team import cabinet as team_cabinet

api_router = APIRouter()

api_router.include_router(public_events.router, prefix="/public", tags=["public"])
api_router.include_router(registration.router, prefix="/registration", tags=["registration"])
api_router.include_router(auth_team.router, prefix="/auth/team", tags=["auth-team"])
api_router.include_router(auth_admin.router, prefix="/auth/admin", tags=["auth-admin"])
api_router.include_router(team_cabinet.router, prefix="/team", tags=["team-cabinet"])
api_router.include_router(admin_events.router, prefix="/admin/events", tags=["admin-events"])
api_router.include_router(admin_invites.router, prefix="/admin/invites", tags=["admin-invites"])
api_router.include_router(admin_teams.router, prefix="/admin/teams", tags=["admin-teams"])
api_router.include_router(admin_export.router, prefix="/admin/export", tags=["admin-export"])
