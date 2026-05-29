from pydantic import BaseModel, Field

from app.db.models.enums import EventStatus

class TrackPublicSchema(BaseModel):
    id: int
    title: str
    slug: str
    description: str
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
    status: EventStatus
    registration_open: bool
    total_seats_available: int

    model_config = {"from_attributes": True}


class EventDetailSchema(EventCardSchema):
    tracks: list[TrackPublicSchema]


class TrackCreateSchema(BaseModel):
    title: str
    slug: str
    description: str = ""
    team_limit: int = Field(..., gt=0)


class EventCreateSchema(BaseModel):
    title: str
    slug: str
    description: str = ""
    tracks: list[TrackCreateSchema] = Field(default_factory=list)


class EventUpdateSchema(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    status: EventStatus | None = None
    tracks: list[TrackCreateSchema] | None = None


class EventAdminSchema(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    status: EventStatus
    tracks: list[TrackPublicSchema]

    model_config = {"from_attributes": True}
