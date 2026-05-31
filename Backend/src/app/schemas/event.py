from datetime import datetime

from pydantic import BaseModel, Field

from app.db.models.enums import EventStatus

class TrackPublicSchema(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    keywords: str = ""
    team_limit: int
    teams_registered: int
    seats_available: int
    registration_status: str

    model_config = {"from_attributes": True}


class EventCardSchema(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    keywords: str = ""
    brand: str = ""
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: EventStatus
    registration_open: bool
    total_seats_available: int
    total_seats_limit: int = 0
    total_teams_registered: int = 0

    model_config = {"from_attributes": True}


class EventDetailSchema(EventCardSchema):
    tracks: list[TrackPublicSchema]


class TrackCreateSchema(BaseModel):
    title: str
    slug: str
    description: str = ""
    keywords: str = ""
    team_limit: int = Field(..., gt=0)


class TrackUpsertSchema(BaseModel):
    id: int | None = Field(default=None, description="ID существующего кейса; без id — создать новый")
    title: str
    slug: str
    description: str = ""
    keywords: str = ""
    team_limit: int = Field(..., gt=0)


class EventCreateSchema(BaseModel):
    title: str
    slug: str
    description: str = ""
    keywords: str = ""
    brand: str = ""
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    tracks: list[TrackCreateSchema] = Field(default_factory=list)


class EventUpdateSchema(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    keywords: str | None = None
    brand: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: EventStatus | None = None
    tracks: list[TrackUpsertSchema] | None = None


class EventAdminSchema(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    keywords: str = ""
    brand: str = ""
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: EventStatus
    tracks: list[TrackPublicSchema]

    model_config = {"from_attributes": True}
