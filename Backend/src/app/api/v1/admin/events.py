from fastapi import APIRouter, Response, status

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


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> Response:
    await EventService(db).delete_event(event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{event_id}/tracks/{track_id}", response_model=EventAdminSchema)
async def delete_track(
    event_id: int,
    track_id: int,
    _admin: CurrentAdmin,
    db: DbSession,
) -> EventAdminSchema:
    return await EventService(db).delete_track(event_id, track_id)
