from fastapi import APIRouter

from app.dependencies import CurrentAdmin, DbSession
from app.schemas.event import EventAdminSchema, EventCreateSchema, EventUpdateSchema
from app.services.event_service import EventService

router = APIRouter()

@router.get("", response_model=list[EventAdminSchema])
async def list_events(_admin: CurrentAdmin, db: DbSession) -> list[EventAdminSchema]:
    return await EventService(db).list_admin_events()


@router.post("", response_model=EventAdminSchema, status_code=201)
async def create_event(
    body: EventCreateSchema,
    _admin: CurrentAdmin,
    db: DbSession,
) -> EventAdminSchema:
    return await EventService(db).create_event(body)


@router.patch("/{event_id}", response_model=EventAdminSchema)
async def update_event(
    event_id: int,
    body: EventUpdateSchema,
    _admin: CurrentAdmin,
    db: DbSession,
) -> EventAdminSchema:
    return await EventService(db).update_event(event_id, body)


@router.post("/{event_id}/finish", response_model=EventAdminSchema)
async def finish_event(
    event_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> EventAdminSchema:
    return await EventService(db).finish_event(event_id)
