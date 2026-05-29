from pydantic import BaseModel, EmailStr, Field

from app.core.validators import PhoneNumber

class TeamCabinetSchema(BaseModel):
    id: int
    team_name: str
    captain_full_name: str
    email: EmailStr
    phone: PhoneNumber
    event_title: str
    event_slug: str
    track_title: str
    track_id: int

    model_config = {"from_attributes": True}


class TeamUpdateSchema(BaseModel):
    team_name: str | None = Field(default=None, min_length=2, max_length=255)
    captain_full_name: str | None = Field(default=None, min_length=3, max_length=255)
    email: EmailStr | None = None
    phone: PhoneNumber | None = None
    track_id: int | None = Field(default=None, description="Смена кейса при наличии мест")


class TeamAdminSchema(BaseModel):
    id: int
    name: str
    captain_full_name: str
    email: EmailStr
    phone: str
    track_title: str
    created_at: str

    model_config = {"from_attributes": True}


class TrackStatsSchema(BaseModel):
    track_id: int
    track_title: str
    limit: int
    occupied: int
    available: int
    status: str
