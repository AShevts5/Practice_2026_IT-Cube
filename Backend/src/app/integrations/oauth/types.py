from dataclasses import dataclass
from typing import Literal

OAuthProviderId = Literal["github", "yandex", "vk"]
OAuthFlow = Literal["login", "register"]

@dataclass(frozen=True, slots=True)
class OAuthUserInfo:
    provider_user_id: str
    email: str
    full_name: str
