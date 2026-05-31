from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models.captain import Captain
from app.schemas.captain import CaptainProfileSchema, CaptainRegisterRequest


class CaptainService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _to_profile(self, captain: Captain) -> CaptainProfileSchema:
        return CaptainProfileSchema(
            id=captain.id,
            email=captain.email,
            full_name=captain.full_name,
            phone=captain.phone,
            has_team=captain.team_id is not None,
            team_id=captain.team_id,
        )

    async def register(self, data: CaptainRegisterRequest) -> str:
        email = str(data.email).lower()
        existing = await self.db.execute(select(Captain).where(Captain.email == email))
        if existing.scalar_one_or_none():
            raise ConflictError("Капитан с таким email уже зарегистрирован")

        captain = Captain(
            email=email,
            password_hash=hash_password(data.password),
            full_name=data.full_name.strip(),
            phone=data.phone,
        )
        self.db.add(captain)
        await self.db.flush()
        return create_access_token(str(captain.id), "captain")

    async def get_profile(self, captain: Captain) -> CaptainProfileSchema:
        return self._to_profile(captain)

    async def get_by_id(self, captain_id: int) -> Captain | None:
        result = await self.db.execute(select(Captain).where(Captain.id == captain_id))
        return result.scalar_one_or_none()

    async def verify_login(self, email: str, password: str) -> Captain:
        normalized = email.strip().lower()
        result = await self.db.execute(
            select(Captain).where(Captain.email == normalized, Captain.is_active.is_(True))
        )
        captain = result.scalar_one_or_none()
        if captain is None or not verify_password(password, captain.password_hash):
            raise UnauthorizedError("Неверный email или пароль")
        return captain
