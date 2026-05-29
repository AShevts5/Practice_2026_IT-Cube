from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import generate_invite_code, hash_code, verify_code
from app.db.models.event import Event
from app.db.models.invite_code import InviteCode
from app.schemas.invite import InviteCodeGeneratedSchema, InviteCodeSchema


class InviteService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _to_schema(self, invite: InviteCode) -> InviteCodeSchema:
        return InviteCodeSchema(
            id=invite.id,
            label=invite.label,
            is_used=invite.used_at is not None,
            used_at=invite.used_at.isoformat() if invite.used_at else None,
            created_at=invite.created_at.isoformat(),
        )

    async def _ensure_event(self, event_id: int) -> Event:
        event = await self.db.get(Event, event_id)
        if event is None:
            raise NotFoundError("Мероприятие не найдено")
        return event

    async def list_for_event(self, event_id: int) -> list[InviteCodeSchema]:
        await self._ensure_event(event_id)
        stmt = select(InviteCode).where(InviteCode.event_id == event_id).order_by(InviteCode.id.desc())
        invites = (await self.db.execute(stmt)).scalars().all()
        return [self._to_schema(i) for i in invites]

    async def generate_batch(
        self,
        event_id: int,
        count: int,
        label_prefix: str | None,
    ) -> list[InviteCodeGeneratedSchema]:
        await self._ensure_event(event_id)
        created: list[InviteCodeGeneratedSchema] = []
        for index in range(count):
            plain = generate_invite_code()
            label = f"{label_prefix}-{index + 1}" if label_prefix else None
            invite = InviteCode(
                event_id=event_id,
                code_hash=hash_code(plain),
                label=label,
            )
            self.db.add(invite)
            await self.db.flush()
            created.append(
                InviteCodeGeneratedSchema(
                    id=invite.id,
                    code=plain,
                    label=label,
                    is_used=False,
                    created_at=invite.created_at.isoformat(),
                )
            )
        return created

    async def create_manual(
        self,
        event_id: int,
        code: str,
        label: str | None,
    ) -> InviteCodeGeneratedSchema:
        await self._ensure_event(event_id)
        stmt = select(InviteCode).where(InviteCode.event_id == event_id)
        existing = (await self.db.execute(stmt)).scalars().all()
        normalized = code.strip().upper()
        for invite in existing:
            if verify_code(normalized, invite.code_hash):
                raise ConflictError("Такой код приглашения уже существует")

        invite = InviteCode(
            event_id=event_id,
            code_hash=hash_code(normalized),
            label=label,
        )
        self.db.add(invite)
        await self.db.flush()
        return InviteCodeGeneratedSchema(
            id=invite.id,
            code=normalized,
            label=label,
            is_used=False,
            created_at=invite.created_at.isoformat(),
        )
