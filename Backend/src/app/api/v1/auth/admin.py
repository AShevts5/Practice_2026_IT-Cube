from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import LoginRequest, OtpRequest, OtpVerifyRequest, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/login")
async def admin_login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await AuthService(db).start_admin_login(body.login, body.password)


@router.post("/otp/send")
async def resend_admin_otp(
    body: OtpRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await AuthService(db).resend_admin_otp(body.challenge_id, channel=body.channel)


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_admin_otp(
    body: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await AuthService(db).verify_admin_otp(body.challenge_id, body.code)
