from datetime import UTC, datetime, timedelta

import pytest
from jose import jwt

from app.config import settings
from app.core.security import (
    ALGORITHM,
    PASSWORD_RESET_TYP,
    create_password_reset_token,
    decode_password_reset_token,
)


def test_password_reset_token_roundtrip() -> None:
    token = create_password_reset_token(42, "captain")
    payload = decode_password_reset_token(token)
    assert payload == {"sub": "42", "role": "captain"}


def test_password_reset_token_rejects_access_token() -> None:
    expire = datetime.now(UTC) + timedelta(minutes=5)
    access = jwt.encode(
        {"sub": "1", "role": "admin", "exp": int(expire.timestamp())},
        settings.secret_key,
        algorithm=ALGORITHM,
    )
    with pytest.raises(ValueError):
        decode_password_reset_token(access)


def test_password_reset_token_rejects_wrong_typ() -> None:
    expire = datetime.now(UTC) + timedelta(hours=1)
    bad = jwt.encode(
        {
            "sub": "1",
            "role": "admin",
            "typ": "other",
            "exp": int(expire.timestamp()),
        },
        settings.secret_key,
        algorithm=ALGORITHM,
    )
    with pytest.raises(ValueError):
        decode_password_reset_token(bad)


def test_password_reset_token_rejects_invalid_role() -> None:
    expire = datetime.now(UTC) + timedelta(hours=1)
    bad = jwt.encode(
        {
            "sub": "1",
            "role": "guest",
            "typ": PASSWORD_RESET_TYP,
            "exp": int(expire.timestamp()),
        },
        settings.secret_key,
        algorithm=ALGORITHM,
    )
    with pytest.raises(ValueError):
        decode_password_reset_token(bad)
