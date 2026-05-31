from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import LoginRequest, OtpRequest, OtpVerifyRequest, TokenResponse
from app.schemas.captain import CaptainRegisterRequest
from app.services.auth_service import AuthService
from app.services.captain_service import CaptainService

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def captain_register(
    body: CaptainRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    token = await CaptainService(db).register(body)
    return TokenResponse(access_token=token)


@router.post("/login")
async def captain_login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await AuthService(db).start_captain_login(body.login, body.password)


@router.post("/otp/send")
async def resend_captain_otp(
    body: OtpRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await AuthService(db).resend_captain_otp(body.challenge_id, channel=body.channel)


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_captain_otp(
    body: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await AuthService(db).verify_captain_otp(body.challenge_id, body.code)
