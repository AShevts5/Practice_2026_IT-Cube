from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession
from app.schemas.invite import (
    InviteCodeCreateSchema,
    InviteCodeGeneratedSchema,
    InviteCodeSchema,
    InviteGenerateSchema,
)
from app.services.invite_service import InviteService

router = APIRouter()

@router.get("/events/{event_id}", response_model=list[InviteCodeSchema])
async def list_invites(
    event_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> list[InviteCodeSchema]:
    return await InviteService(db).list_for_event(event_id)


@router.post("/events/{event_id}/generate", response_model=list[InviteCodeGeneratedSchema])
async def generate_invites(
    event_id: int,
    body: InviteGenerateSchema,
    _admin: CurrentAdmin,
    db: DbSession,
) -> list[InviteCodeGeneratedSchema]:
    return await InviteService(db).generate_batch(event_id, body.count, body.label_prefix)


@router.post("/events/{event_id}", response_model=InviteCodeGeneratedSchema, status_code=201)
async def add_invite_manually(
    event_id: int,
    body: InviteCodeCreateSchema,
    _admin: CurrentAdmin,
    db: DbSession,
) -> InviteCodeGeneratedSchema:
    return await InviteService(db).create_manual(event_id, body.code, body.label)
