from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.security import generate_password, generate_team_login, hash_password, verify_code
from app.db.models.event import Event
from app.db.models.invite_code import InviteCode
from app.db.models.team import Team
from app.schemas.registration import RegistrationRequest, RegistrationResponse
from app.services.helpers import count_teams_on_track, is_registration_open


class RegistrationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _find_valid_invite(self, event_id: int, plain_code: str) -> InviteCode:
        stmt = select(InviteCode).where(
            InviteCode.event_id == event_id,
            InviteCode.used_at.is_(None),
        )
        result = await self.db.execute(stmt)
        invites = result.scalars().all()
        for invite in invites:
            if verify_code(plain_code, invite.code_hash):
                return invite
        raise ValidationError("Неверный или уже использованный код приглашения")

    async def register_team(
        self,
        event_slug: str,
        data: RegistrationRequest,
    ) -> RegistrationResponse:
        stmt = select(Event).where(Event.slug == event_slug).options(selectinload(Event.tracks))
        result = await self.db.execute(stmt)
        event = result.scalar_one_or_none()
        if event is None:
            raise NotFoundError("Мероприятие не найдено")
        if not is_registration_open(event.status):
            raise ValidationError("Регистрация на это мероприятие закрыта")

        track = next((t for t in event.tracks if t.id == data.track_id), None)
        if track is None:
            raise ValidationError("Выбранный кейс не относится к этому мероприятию")

        invite = await self._find_valid_invite(event.id, data.invite_code)

        occupied = await count_teams_on_track(self.db, track.id)
        if occupied >= track.team_limit:
            raise ValidationError("Лимит мест по выбранному кейсу исчерпан")

        dup_name = await self.db.execute(
            select(Team).where(Team.event_id == event.id, Team.name == data.team_name)
        )
        if dup_name.scalar_one_or_none():
            raise ConflictError("Команда с таким названием уже зарегистрирована")

        plain_password = generate_password()
        login = generate_team_login()

        team = Team(
            event_id=event.id,
            track_id=track.id,
            invite_code_id=invite.id,
            name=data.team_name,
            captain_full_name=data.captain_full_name,
            email=str(data.email).lower(),
            phone=data.phone,
            login=login,
            password_hash=hash_password(plain_password),
        )
        self.db.add(team)
        invite.used_at = datetime.now(UTC)
        await self.db.flush()

        return RegistrationResponse(
            team_id=team.id,
            login=login,
            password=plain_password,
        )
