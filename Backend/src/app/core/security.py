import secrets
import string
from datetime import UTC, datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=[settings.password_hash_scheme], deprecated="auto")

ALGORITHM = "HS256"

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_code(plain: str) -> str:
    return pwd_context.hash(plain.strip().upper())

def verify_code(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain.strip().upper(), hashed)

def generate_team_login() -> str:
    return f"team_{secrets.token_hex(4)}"

def generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

def generate_invite_code(length: int = 10) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

def generate_otp(length: int | None = None) -> str:
    size = length or settings.otp_length
    return "".join(secrets.choice(string.digits) for _ in range(size))

def create_access_token(subject: str, role: str, *, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {
        "sub": subject,
        "role": role,
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, str]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        role = payload.get("role")
        if not isinstance(sub, str) or not isinstance(role, str):
            raise JWTError("invalid payload")
        return {"sub": sub, "role": role}
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
