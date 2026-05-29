from pydantic import BaseModel, EmailStr, Field

from app.core.validators import PhoneNumber

class RegistrationRequest(BaseModel):
    track_id: int
    team_name: str = Field(..., min_length=2, max_length=255)
    captain_full_name: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    phone: PhoneNumber
    invite_code: str = Field(..., min_length=4, max_length=32)


class RegistrationResponse(BaseModel):
    team_id: int
    login: str
    password: str = Field(..., description="Показывается один раз при регистрации")
    message: str = "Сохраните логин и пароль для входа в личный кабинет"
