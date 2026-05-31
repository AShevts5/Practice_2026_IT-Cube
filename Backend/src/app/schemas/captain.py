from pydantic import BaseModel, EmailStr, Field

from app.core.validators import PhoneNumber


class CaptainRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=3, max_length=255)
    phone: PhoneNumber


class CaptainProfileSchema(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str
    has_team: bool
    team_id: int | None
