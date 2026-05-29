from pydantic import BaseModel, Field

class InviteCodeSchema(BaseModel):
    id: int
    label: str | None
    is_used: bool
    used_at: str | None
    created_at: str


class InviteCodeGeneratedSchema(InviteCodeSchema):
    code: str = Field(..., description="Показывается один раз при создании")


class InviteGenerateSchema(BaseModel):
    count: int = Field(..., ge=1, le=500)
    label_prefix: str | None = None


class InviteCodeCreateSchema(BaseModel):
    code: str = Field(..., min_length=4, max_length=32)
    label: str | None = None
