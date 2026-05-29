from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import generate_otp, hash_code, verify_code
from app.db.models.otp_challenge import OtpChallenge, OtpChannel, OtpPurpose


class OtpService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _is_expired(self, challenge: OtpChallenge) -> bool:
        expires = challenge.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return datetime.now(UTC) > expires

    async def create_challenge(
        self,
        *,
        purpose: OtpPurpose,
        channel: OtpChannel,
        subject_type: str,
        subject_id: int,
        destination: str,
    ) -> tuple[OtpChallenge, str]:
        plain = generate_otp()
        challenge = OtpChallenge(
            purpose=purpose,
            channel=channel,
            subject_type=subject_type,
            subject_id=subject_id,
            code_hash=hash_code(plain),
            destination=destination,
            expires_at=datetime.now(UTC) + timedelta(seconds=settings.otp_ttl_seconds),
            max_attempts=settings.otp_max_attempts,
            created_at=datetime.now(UTC),
        )
        self.db.add(challenge)
        await self.db.flush()
        return challenge, plain

    async def verify(self, challenge: OtpChallenge, plain: str) -> bool:
        if challenge.used_at is not None:
            return False
        if self._is_expired(challenge):
            return False
        if challenge.attempts >= challenge.max_attempts:
            return False
        challenge.attempts += 1
        if not verify_code(plain, challenge.code_hash):
            return False
        challenge.used_at = datetime.now(UTC)
        return True
