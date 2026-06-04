from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await AuthService(db).request_password_reset(body.email)
    return MessageResponse(
        message="Если email зарегистрирован, на него отправлена ссылка для сброса пароля",
    )


@router.post("/reset-password/{token}", response_model=MessageResponse)
async def reset_password(
    token: str,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await AuthService(db).reset_password(token, body.password)
    return MessageResponse(message="Пароль обновлён. Теперь можно войти.")
