from typing import Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import TokenResponse
from app.schemas.oauth import OAuthCompleteRequest
from app.services.oauth_service import OAuthService

router = APIRouter()

@router.get("/{provider}/authorize")
async def oauth_authorize(
    provider: Literal["github", "yandex", "vk"],
    flow: Literal["login", "register"] = "login",
) -> object:
    return OAuthService.authorize_redirect(provider, flow)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: Literal["github", "yandex", "vk"],
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> object:
    return await OAuthService(db).handle_callback(
        provider,
        code=code,
        state=state,
        error=error,
    )

@router.post("/complete", response_model=TokenResponse)
async def oauth_complete(
    body: OAuthCompleteRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await OAuthService(db).complete_signup(body)
