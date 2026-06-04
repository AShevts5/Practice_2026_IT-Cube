from urllib.parse import urlencode
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import ConflictError, ValidationError
from app.core.security import create_access_token, generate_password, hash_password
from app.db.models.captain import Captain
from app.db.models.captain_oauth import CaptainOAuthAccount
from app.integrations.oauth.providers import get_provider
from app.integrations.oauth.tokens import (
    create_oauth_signup_token,
    create_oauth_state_token,
    decode_oauth_signup_token,
    decode_oauth_state_token,
)
from app.integrations.oauth.types import OAuthFlow, OAuthUserInfo
from app.schemas.auth import TokenResponse
from app.schemas.oauth import OAuthCompleteRequest
from app.services.captain_service import CaptainService


class OAuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def callback_uri(self, provider_id: str) -> str:
        base = settings.oauth_backend_callback_base.rstrip("/")
        return f"{base}/{provider_id}/callback"

    def _frontend_redirect(self, **params: str) -> RedirectResponse:
        query = urlencode({k: v for k, v in params.items() if v})
        url = settings.oauth_frontend_redirect
        if query:
            sep = "&" if "?" in url else "?"
            url = f"{url}{sep}{query}"
        return RedirectResponse(url=url, status_code=302)

    @staticmethod
    def authorize_redirect(provider_id: str, flow: OAuthFlow) -> RedirectResponse:
        provider = get_provider(provider_id)
        if not provider.is_configured():
            raise ValidationError(f"OAuth {provider_id} не настроен на сервере")

        state = create_oauth_state_token(provider_id, flow)
        url = provider.authorize_url(state, self.callback_uri(provider_id))
        return RedirectResponse(url=url, status_code=302)

    async def handle_callback(
        self,
        provider_id: str,
        *,
        code: str | None,
        state: str | None,
        error: str | None = None,
    ) -> RedirectResponse:
        if error:
            return self._frontend_redirect(status="error", message=error)
        if not code or not state:
            return self._frontend_redirect(status="error", message="missing_code")

        try:
            state_data = decode_oauth_state_token(state)
        except ValueError as exc:
            return self._frontend_redirect(status="error", message=str(exc))

        if state_data["provider"] != provider_id:
            return self._frontend_redirect(status="error", message="provider_mismatch")

        provider = get_provider(provider_id)
        if not provider.is_configured():
            return self._frontend_redirect(status="error", message="provider_not_configured")

        try:
            user_info = await provider.exchange_code(code, self.callback_uri(provider_id))
        except ValidationError as exc:
            return self._frontend_redirect(status="error", message=str(exc))
        except Exception:
            return self._frontend_redirect(
                status="error",
                message="Не удалось завершить вход через соцсеть",
            )

        flow: OAuthFlow = state_data["flow"]  # type: ignore[assignment]
        if flow == "login":
            return await self._finish_login(provider_id, user_info)
        return await self._finish_register(provider_id, user_info)

    async def _finish_login(
        self,
        provider_id: str,
        user_info: OAuthUserInfo,
    ) -> RedirectResponse:
        captain = await self._resolve_captain_for_login(provider_id, user_info)
        if captain is None:
            return self._frontend_redirect(
                status="error",
                message="Аккаунт не найден. Сначала зарегистрируйтесь как капитан.",
            )
        if not captain.is_active:
            return self._frontend_redirect(
                status="error",
                message="Аккаунт не активирован. Завершите регистрацию по email.",
            )
        token = create_access_token(str(captain.id), "captain")
        return self._frontend_redirect(status="success", access_token=token)

    async def _finish_register(
        self,
        provider_id: str,
        user_info: OAuthUserInfo,
    ) -> RedirectResponse:
        oauth_link = await self._find_oauth_link(provider_id, user_info.provider_user_id)
        if oauth_link is not None:
            captain = await self._get_captain_by_id(oauth_link.captain_id)
            if captain and captain.is_active:
                token = create_access_token(str(captain.id), "captain")
                return self._frontend_redirect(status="success", access_token=token)

        result = await self.db.execute(
            select(Captain).where(Captain.email == user_info.email)
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            if not existing.is_active:
                return self._frontend_redirect(
                    status="error",
                    message="Завершите регистрацию по email или войдите с паролем.",
                )
            await self._ensure_oauth_link(existing.id, provider_id, user_info.provider_user_id)
            token = create_access_token(str(existing.id), "captain")
            return self._frontend_redirect(status="success", access_token=token)

        signup_token = create_oauth_signup_token(
            provider=provider_id,
            provider_user_id=user_info.provider_user_id,
            email=user_info.email,
            full_name=user_info.full_name,
        )
        return self._frontend_redirect(status="complete", signup_token=signup_token)

    async def complete_signup(self, body: OAuthCompleteRequest) -> TokenResponse:
        try:
            data = decode_oauth_signup_token(body.signup_token)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

        provider_id = data["provider"]
        provider_user_id = data["provider_user_id"]
        email = data["email"].lower()

        oauth_link = await self._find_oauth_link(provider_id, provider_user_id)
        if oauth_link is not None:
            captain = await self._get_captain_by_id(oauth_link.captain_id)
            if captain and captain.is_active:
                return TokenResponse(access_token=create_access_token(str(captain.id), "captain"))

        result = await self.db.execute(select(Captain).where(Captain.email == email))
        existing = result.scalar_one_or_none()
        if existing is not None:
            if existing.is_active:
                raise ConflictError("Капитан с таким email уже зарегистрирован")
            existing.full_name = body.full_name.strip()
            existing.phone = body.phone
            existing.password_hash = hash_password(generate_password(24))
            existing.is_active = True
            await self._ensure_oauth_link(existing.id, provider_id, provider_user_id)
            await self.db.flush()
            return TokenResponse(access_token=create_access_token(str(existing.id), "captain"))

        captain = Captain(
            email=email,
            password_hash=hash_password(generate_password(24)),
            full_name=body.full_name.strip(),
            phone=body.phone,
            is_active=True,
        )
        self.db.add(captain)
        await self.db.flush()
        await self._ensure_oauth_link(captain.id, provider_id, provider_user_id)
        return TokenResponse(access_token=create_access_token(str(captain.id), "captain"))

    async def _resolve_captain_for_login(
        self,
        provider_id: str,
        user_info: OAuthUserInfo,
    ) -> Captain | None:
        oauth_link = await self._find_oauth_link(provider_id, user_info.provider_user_id)
        if oauth_link is not None:
            return await self._get_captain_by_id(oauth_link.captain_id)

        result = await self.db.execute(
            select(Captain).where(Captain.email == user_info.email)
        )
        captain = result.scalar_one_or_none()
        if captain is None:
            return None
        await self._ensure_oauth_link(captain.id, provider_id, user_info.provider_user_id)
        return captain

    async def _find_oauth_link(
        self,
        provider_id: str,
        provider_user_id: str,
    ) -> CaptainOAuthAccount | None:
        result = await self.db.execute(
            select(CaptainOAuthAccount).where(
                CaptainOAuthAccount.provider == provider_id,
                CaptainOAuthAccount.provider_user_id == provider_user_id,
            )
        )
        return result.scalar_one_or_none()

    async def _ensure_oauth_link(
        self,
        captain_id: int,
        provider_id: str,
        provider_user_id: str,
    ) -> None:
        existing = await self._find_oauth_link(provider_id, provider_user_id)
        if existing is not None:
            if existing.captain_id != captain_id:
                raise ConflictError("Этот аккаунт соцсети уже привязан к другому капитану")
            return
        self.db.add(
            CaptainOAuthAccount(
                captain_id=captain_id,
                provider=provider_id,
                provider_user_id=provider_user_id,
            )
        )
        await self.db.flush()

    async def _get_captain_by_id(self, captain_id: int) -> Captain | None:
        return await CaptainService(self.db).get_by_id(captain_id)
