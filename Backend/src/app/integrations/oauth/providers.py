from abc import ABC, abstractmethod
from urllib.parse import urlencode
import httpx

from app.config import settings
from app.core.exceptions import ValidationError
from app.integrations.oauth.types import OAuthProviderId, OAuthUserInfo


class OAuthProvider(ABC):
    id: OAuthProviderId

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def authorize_url(self, state: str, redirect_uri: str) -> str: ...

    @abstractmethod
    async def exchange_code(self, code: str, redirect_uri: str) -> OAuthUserInfo: ...


class GitHubOAuthProvider(OAuthProvider):
    id = "github"

    def is_configured(self) -> bool:
        return bool(settings.github_client_id and settings.github_client_secret)

    def authorize_url(self, state: str, redirect_uri: str) -> str:
        query = urlencode(
            {
                "client_id": settings.github_client_id,
                "redirect_uri": redirect_uri,
                "scope": "read:user user:email",
                "state": state,
            }
        )
        return f"https://github.com/login/oauth/authorize?{query}"

    async def exchange_code(self, code: str, redirect_uri: str) -> OAuthUserInfo:
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_resp = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValidationError("Не удалось получить токен GitHub")

            user_resp = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                },
            )
            user_resp.raise_for_status()
            user = user_resp.json()

            email = user.get("email")
            if not email:
                emails_resp = await client.get(
                    "https://api.github.com/user/emails",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Accept": "application/vnd.github+json",
                    },
                )
                emails_resp.raise_for_status()
                emails = emails_resp.json()
                primary = next(
                    (item["email"] for item in emails if item.get("primary") and item.get("verified")),
                    None,
                )
                email = primary or next(
                    (item["email"] for item in emails if item.get("verified")),
                    None,
                )

            if not email:
                raise ValidationError("У аккаунта GitHub нет подтверждённого email")

            name = user.get("name") or user.get("login") or email.split("@", 1)[0]
            return OAuthUserInfo(
                provider_user_id=str(user["id"]),
                email=email.lower(),
                full_name=name.strip(),
            )


class YandexOAuthProvider(OAuthProvider):
    id = "yandex"

    def is_configured(self) -> bool:
        return bool(settings.yandex_client_id and settings.yandex_client_secret)

    def authorize_url(self, state: str, redirect_uri: str) -> str:
        query = urlencode(
            {
                "response_type": "code",
                "client_id": settings.yandex_client_id,
                "redirect_uri": redirect_uri,
                "state": state,
            }
        )
        return f"https://oauth.yandex.ru/authorize?{query}"

    async def exchange_code(self, code: str, redirect_uri: str) -> OAuthUserInfo:
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_resp = await client.post(
                "https://oauth.yandex.ru/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                    "redirect_uri": redirect_uri,
                },
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValidationError("Не удалось получить токен Яндекса")

            info_resp = await client.get(
                "https://login.yandex.ru/info",
                params={"format": "json"},
                headers={"Authorization": f"OAuth {access_token}"},
            )
            info_resp.raise_for_status()
            info = info_resp.json()

            email = info.get("default_email") or (info.get("emails") or [None])[0]
            if not email:
                raise ValidationError("У аккаунта Яндекса не указан email")

            name = " ".join(
                part
                for part in (info.get("last_name"), info.get("first_name"))
                if part
            ).strip()
            if not name:
                name = info.get("display_name") or info.get("login") or email.split("@", 1)[0]

            return OAuthUserInfo(
                provider_user_id=str(info["id"]),
                email=email.lower(),
                full_name=name.strip(),
            )


class VkOAuthProvider(OAuthProvider):
    id = "vk"

    def is_configured(self) -> bool:
        return bool(settings.vk_client_id and settings.vk_client_secret)

    def authorize_url(self, state: str, redirect_uri: str) -> str:
        query = urlencode(
            {
                "client_id": settings.vk_client_id,
                "redirect_uri": redirect_uri,
                "display": "page",
                "scope": "email",
                "response_type": "code",
                "state": state,
                "v": "5.131",
            }
        )
        return f"https://oauth.vk.com/authorize?{query}"

    async def exchange_code(self, code: str, redirect_uri: str) -> OAuthUserInfo:
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_resp = await client.get(
                "https://oauth.vk.com/access_token",
                params={
                    "client_id": settings.vk_client_id,
                    "client_secret": settings.vk_client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()
            if "error" in token_data:
                raise ValidationError(token_data.get("error_description", "Ошибка VK OAuth"))

            access_token = token_data.get("access_token")
            user_id = token_data.get("user_id")
            email = token_data.get("email")
            if not access_token or not user_id:
                raise ValidationError("Не удалось получить токен VK")
            if not email:
                raise ValidationError(
                    "У аккаунта VK нет email. Разрешите доступ к email при входе."
                )

            users_resp = await client.get(
                "https://api.vk.com/method/users.get",
                params={
                    "user_ids": user_id,
                    "fields": "first_name,last_name",
                    "access_token": access_token,
                    "v": "5.131",
                },
            )
            users_resp.raise_for_status()
            payload = users_resp.json()
            if "error" in payload:
                raise ValidationError(payload["error"].get("error_msg", "Ошибка VK API"))

            users = payload.get("response") or []
            if users:
                first = users[0].get("first_name", "")
                last = users[0].get("last_name", "")
                full_name = f"{first} {last}".strip()
            else:
                full_name = email.split("@", 1)[0]

            return OAuthUserInfo(
                provider_user_id=str(user_id),
                email=email.lower(),
                full_name=full_name or email.split("@", 1)[0],
            )


PROVIDERS: dict[OAuthProviderId, OAuthProvider] = {
    "github": GitHubOAuthProvider(),
    "yandex": YandexOAuthProvider(),
    "vk": VkOAuthProvider(),
}


def get_provider(provider_id: str) -> OAuthProvider:
    if provider_id not in PROVIDERS:
        raise ValidationError("Неизвестный OAuth-провайдер")
    return PROVIDERS[provider_id]  # type: ignore[index]
