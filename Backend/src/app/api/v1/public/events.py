from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.event import EventCardSchema, EventDetailSchema
from app.services.event_service import EventService

router = APIRouter()

@router.get("/events", response_model=list[EventCardSchema])
async def list_active_events(
    db: AsyncSession = Depends(get_db),
) -> list[EventCardSchema]:
    return await EventService(db).list_public_events()


@router.get("/events/{slug}", response_model=EventDetailSchema)
async def get_event_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> EventDetailSchema:
    return await EventService(db).get_public_event_detail(slug)
