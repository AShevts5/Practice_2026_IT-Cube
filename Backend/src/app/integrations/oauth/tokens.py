from datetime import UTC, datetime, timedelta
from jose import JWTError, jwt
from app.config import settings

ALGORITHM = "HS256"
STATE_TYP = "oauth_state"
SIGNUP_TYP = "oauth_signup"

def create_oauth_state_token(provider: str, flow: str) -> str:
    expire = datetime.now(UTC) + timedelta(seconds=settings.oauth_state_ttl_seconds)
    payload = {
        "typ": STATE_TYP,
        "provider": provider,
        "flow": flow,
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_oauth_state_token(token: str) -> dict[str, str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        if payload.get("typ") != STATE_TYP:
            raise JWTError("invalid typ")
        provider = payload.get("provider")
        flow = payload.get("flow")
        if not isinstance(provider, str) or not isinstance(flow, str):
            raise JWTError("invalid payload")
        return {"provider": provider, "flow": flow}
    except JWTError as exc:
        raise ValueError("Недействительная OAuth-сессия") from exc


def create_oauth_signup_token(
    *,
    provider: str,
    provider_user_id: str,
    email: str,
    full_name: str,
) -> str:
    expire = datetime.now(UTC) + timedelta(seconds=settings.oauth_signup_ttl_seconds)
    payload = {
        "typ": SIGNUP_TYP,
        "provider": provider,
        "provider_user_id": provider_user_id,
        "email": email,
        "full_name": full_name,
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_oauth_signup_token(token: str) -> dict[str, str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        if payload.get("typ") != SIGNUP_TYP:
            raise JWTError("invalid typ")
        fields = ("provider", "provider_user_id", "email", "full_name")
        result: dict[str, str] = {}
        for key in fields:
            value = payload.get(key)
            if not isinstance(value, str):
                raise JWTError("invalid payload")
            result[key] = value
        return result
    except JWTError as exc:
        raise ValueError("Сессия регистрации через OAuth истекла") from exc
