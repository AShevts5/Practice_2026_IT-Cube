from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.validators import PhoneNumber


class CaptainRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=3, max_length=255)
    phone: PhoneNumber
    personal_data_consent: bool = Field(
        ...,
        description="Согласие на обработку персональных данных",
    )

    @field_validator("personal_data_consent")
    @classmethod
    def require_personal_data_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Необходимо согласие на обработку персональных данных")
        return value


class CaptainProfileSchema(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str
    has_team: bool
    team_id: int | None
