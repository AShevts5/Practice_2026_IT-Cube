import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import UnauthorizedError, ValidationError
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from app.db.models.admin_user import AdminUser
from app.db.models.captain import Captain
from app.db.models.otp_challenge import OtpChallenge, OtpChannel, OtpPurpose
from app.db.models.team import Team
from app.integrations.email import SmtpEmailSender
from app.integrations.sms import get_sms_sender
from app.schemas.auth import TokenResponse
from app.schemas.captain import CaptainRegisterRequest
from app.services.captain_service import CaptainService
from app.services.otp_service import OtpService

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.otp = OtpService(db)
        self.email = SmtpEmailSender()

    async def _send_otp(self, challenge: OtpChallenge, plain: str) -> None:
        message = f"Ваш код подтверждения IT-Куб: {plain}. Действует {settings.otp_ttl_seconds // 60} мин."
        try:
            if challenge.channel == OtpChannel.EMAIL:
                await self.email.send(
                    challenge.destination,
                    "Код подтверждения IT-Куб",
                    message,
                )
            else:
                await get_sms_sender().send(challenge.destination, message)
        except Exception as exc:
            logger.exception(
                "OTP delivery failed: channel=%s destination=%s",
                challenge.channel.value,
                challenge.destination,
            )
            raise ValidationError(
                "Не удалось отправить код. Попробуйте позже или проверьте папку «Спам»."
            ) from exc

    async def _check_resend_allowed(self, challenge: OtpChallenge) -> None:
        created = challenge.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=UTC)
        elapsed = datetime.now(UTC) - created
        if elapsed.total_seconds() < settings.otp_resend_cooldown_seconds:
            raise ValidationError("Повторная отправка кода пока недоступна")

    async def start_team_login(self, login: str, password: str) -> TokenResponse:
        result = await self.db.execute(select(Team).where(Team.login == login))
        team = result.scalar_one_or_none()
        if team is None or not verify_password(password, team.password_hash):
            raise UnauthorizedError("Неверный логин или пароль")

        token = create_access_token(str(team.id), "team")
        return TokenResponse(access_token=token)

    async def resend_team_otp(self, challenge_id: int, *, channel: str) -> dict:
        challenge = await self._get_challenge(challenge_id, OtpPurpose.TEAM_LOGIN)
        await self._check_resend_allowed(challenge)
        otp_channel = OtpChannel.SMS if channel == "sms" else OtpChannel.EMAIL
        team = await self._get_team(challenge.subject_id)
        destination = team.phone if otp_channel == OtpChannel.SMS else team.email
        new_challenge, plain = await self.otp.create_challenge(
            purpose=OtpPurpose.TEAM_LOGIN,
            channel=otp_channel,
            subject_type="team",
            subject_id=team.id,
            destination=destination,
        )
        await self._send_otp(new_challenge, plain)
        return {"challenge_id": new_challenge.id, "channel": new_challenge.channel.value}

    async def verify_team_otp(self, challenge_id: int, code: str) -> TokenResponse:
        challenge = await self._get_challenge(challenge_id, OtpPurpose.TEAM_LOGIN)
        if not await self.otp.verify(challenge, code):
            raise ValidationError("Неверный или просроченный код подтверждения")
        token = create_access_token(str(challenge.subject_id), "team")
        return TokenResponse(access_token=token)

    _CAPTAIN_OTP_PURPOSES = (OtpPurpose.CAPTAIN_LOGIN, OtpPurpose.CAPTAIN_REGISTER)

    async def start_captain_register(self, data: CaptainRegisterRequest) -> dict:
        captain = await CaptainService(self.db).create_pending_registration(data)
        challenge, plain = await self.otp.create_challenge(
            purpose=OtpPurpose.CAPTAIN_REGISTER,
            channel=OtpChannel.EMAIL,
            subject_type="captain",
            subject_id=captain.id,
            destination=captain.email,
        )
        await self._send_otp(challenge, plain)
        return {
            "challenge_id": challenge.id,
            "channel": challenge.channel.value,
            "message": "Код отправлен на email для подтверждения регистрации",
        }

    async def start_captain_login(self, login: str, password: str) -> dict:
        email = login.strip().lower()
        result = await self.db.execute(
            select(Captain).where(Captain.email == email, Captain.is_active.is_(True))
        )
        captain = result.scalar_one_or_none()
        if captain is None or not verify_password(password, captain.password_hash):
            raise UnauthorizedError("Неверный email или пароль")

        challenge, plain = await self.otp.create_challenge(
            purpose=OtpPurpose.CAPTAIN_LOGIN,
            channel=OtpChannel.EMAIL,
            subject_type="captain",
            subject_id=captain.id,
            destination=captain.email,
        )
        await self._send_otp(challenge, plain)
        return {
            "challenge_id": challenge.id,
            "channel": challenge.channel.value,
            "message": "Код отправлен на email капитана",
        }

    async def resend_captain_otp(self, challenge_id: int, *, channel: str) -> dict:
        challenge = await self._get_challenge(challenge_id)
        if challenge.purpose not in self._CAPTAIN_OTP_PURPOSES:
            raise ValidationError("Сессия подтверждения не найдена")
        await self._check_resend_allowed(challenge)
        otp_channel = OtpChannel.SMS if channel == "sms" else OtpChannel.EMAIL
        captain = await self._get_captain(challenge.subject_id)
        destination = captain.phone if otp_channel == OtpChannel.SMS else captain.email
        new_challenge, plain = await self.otp.create_challenge(
            purpose=challenge.purpose,
            channel=otp_channel,
            subject_type="captain",
            subject_id=captain.id,
            destination=destination,
        )
        await self._send_otp(new_challenge, plain)
        return {"challenge_id": new_challenge.id, "channel": new_challenge.channel.value}

    async def verify_captain_otp(self, challenge_id: int, code: str) -> TokenResponse:
        challenge = await self._get_challenge(challenge_id)
        if challenge.purpose not in self._CAPTAIN_OTP_PURPOSES:
            raise ValidationError("Сессия подтверждения не найдена")
        if not await self.otp.verify(challenge, code):
            raise ValidationError("Неверный или просроченный код подтверждения")
        if challenge.purpose == OtpPurpose.CAPTAIN_REGISTER:
            await CaptainService(self.db).activate(challenge.subject_id)
        token = create_access_token(str(challenge.subject_id), "captain")
        return TokenResponse(access_token=token)

    async def start_admin_login(self, login: str, password: str) -> dict:
        email = login.strip().lower()
        result = await self.db.execute(
            select(AdminUser).where(AdminUser.email == email, AdminUser.is_active.is_(True))
        )
        admin = result.scalar_one_or_none()
        if admin is None or not verify_password(password, admin.password_hash):
            raise UnauthorizedError("Неверный email или пароль")

        challenge, plain = await self.otp.create_challenge(
            purpose=OtpPurpose.ADMIN_LOGIN,
            channel=OtpChannel.EMAIL,
            subject_type="admin",
            subject_id=admin.id,
            destination=admin.email,
        )
        await self._send_otp(challenge, plain)
        return {
            "challenge_id": challenge.id,
            "channel": challenge.channel.value,
            "message": "Код отправлен на email администратора",
        }

    async def resend_admin_otp(self, challenge_id: int, *, channel: str) -> dict:
        challenge = await self._get_challenge(challenge_id, OtpPurpose.ADMIN_LOGIN)
        await self._check_resend_allowed(challenge)
        otp_channel = OtpChannel.SMS if channel == "sms" else OtpChannel.EMAIL
        admin = await self._get_admin(challenge.subject_id)
        new_challenge, plain = await self.otp.create_challenge(
            purpose=OtpPurpose.ADMIN_LOGIN,
            channel=otp_channel,
            subject_type="admin",
            subject_id=admin.id,
            destination=admin.email,
        )
        await self._send_otp(new_challenge, plain)
        return {"challenge_id": new_challenge.id, "channel": new_challenge.channel.value}

    async def verify_admin_otp(self, challenge_id: int, code: str) -> TokenResponse:
        challenge = await self._get_challenge(challenge_id, OtpPurpose.ADMIN_LOGIN)
        if not await self.otp.verify(challenge, code):
            raise ValidationError("Неверный или просроченный код подтверждения")
        token = create_access_token(str(challenge.subject_id), "admin")
        return TokenResponse(access_token=token)

    async def request_password_reset(self, email: str) -> None:
        normalized = email.strip().lower()
        account = await self._find_account_for_password_reset(normalized)
        if account is None:
            return

        token = create_password_reset_token(account["id"], account["role"])
        reset_url = (
            f"{settings.frontend_base_url.rstrip('/')}/reset-password/{token}"
        )
        subject = "Восстановление пароля — platformhackathons.ru"
        body = (
            "Вы запросили сброс пароля на platformhackathons.ru.\n\n"
            f"Перейдите по ссылке (действует {settings.password_reset_ttl_hours} ч.):\n"
            f"{reset_url}\n\n"
            "Если вы не запрашивали сброс, проигнорируйте это письмо."
        )
        try:
            await self.email.send(account["email"], subject, body)
        except Exception as exc:
            logger.exception(
                "Password reset email failed: role=%s destination=%s",
                account["role"],
                account["email"],
            )
            raise ValidationError(
                "Не удалось отправить письмо. Попробуйте позже или проверьте папку «Спам»."
            ) from exc

    async def reset_password(self, token: str, password: str) -> None:
        try:
            payload = decode_password_reset_token(token)
        except ValueError as exc:
            raise ValidationError("Ссылка для сброса пароля недействительна или устарела") from exc

        subject_id = int(payload["sub"])
        role = payload["role"]
        password_hash = hash_password(password)

        if role == "admin":
            admin = await self._get_admin(subject_id)
            if not admin.is_active:
                raise ValidationError("Ссылка для сброса пароля недействительна или устарела")
            admin.password_hash = password_hash
        elif role == "captain":
            captain = await self._get_captain(subject_id)
            if not captain.is_active:
                raise ValidationError("Ссылка для сброса пароля недействительна или устарела")
            captain.password_hash = password_hash
        else:
            team = await self._get_team(subject_id)
            team.password_hash = password_hash

    async def _find_account_for_password_reset(
        self,
        email: str,
    ) -> dict[str, str | int] | None:
        admin_result = await self.db.execute(
            select(AdminUser).where(
                AdminUser.email == email,
                AdminUser.is_active.is_(True),
            )
        )
        admin = admin_result.scalar_one_or_none()
        if admin is not None:
            return {"id": admin.id, "role": "admin", "email": admin.email}

        captain_result = await self.db.execute(
            select(Captain).where(
                Captain.email == email,
                Captain.is_active.is_(True),
            )
        )
        captain = captain_result.scalar_one_or_none()
        if captain is not None:
            return {"id": captain.id, "role": "captain", "email": captain.email}

        team_result = await self.db.execute(
            select(Team).where(Team.email == email).order_by(Team.id).limit(1)
        )
        team = team_result.scalar_one_or_none()
        if team is not None:
            return {"id": team.id, "role": "team", "email": team.email}

        return None

    async def _get_challenge(
        self,
        challenge_id: int,
        purpose: OtpPurpose | None = None,
    ) -> OtpChallenge:
        stmt = select(OtpChallenge).where(OtpChallenge.id == challenge_id)
        if purpose is not None:
            stmt = stmt.where(OtpChallenge.purpose == purpose)
        result = await self.db.execute(stmt)
        challenge = result.scalar_one_or_none()
        if challenge is None:
            raise ValidationError("Сессия подтверждения не найдена")
        return challenge

    async def _get_team(self, team_id: int) -> Team:
        result = await self.db.execute(select(Team).where(Team.id == team_id))
        team = result.scalar_one_or_none()
        if team is None:
            raise UnauthorizedError("Команда не найдена")
        return team

    async def _get_captain(self, captain_id: int) -> Captain:
        result = await self.db.execute(select(Captain).where(Captain.id == captain_id))
        captain = result.scalar_one_or_none()
        if captain is None:
            raise UnauthorizedError("Капитан не найден")
        return captain

    async def _get_admin(self, admin_id: int) -> AdminUser:
        result = await self.db.execute(select(AdminUser).where(AdminUser.id == admin_id))
        admin = result.scalar_one_or_none()
        if admin is None:
            raise UnauthorizedError("Администратор не найден")
        return admin
