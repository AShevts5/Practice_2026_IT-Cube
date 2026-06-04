from dataclasses import dataclass
from typing import Annotated
from fastapi import Header
from app.core.security import decode_access_token

@dataclass(frozen=True, slots=True)
class OptionalUserIdentity:
    role: str
    sub: str

def get_optional_user_identity(
    authorization: Annotated[str | None, Header()] = None,
) -> OptionalUserIdentity | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except ValueError:
        return None
    role = payload.get("role")
    sub = payload.get("sub")
    if not isinstance(role, str) or not isinstance(sub, str):
        return None
    return OptionalUserIdentity(role=role, sub=sub)
