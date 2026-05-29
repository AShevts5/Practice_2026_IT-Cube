from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

class Team(Base, TimestampMixin):
    __tablename__ = "teams"
    __table_args__ = (
        UniqueConstraint("event_id", "name", name="uq_team_name_per_event"),
        UniqueConstraint("login", name="uq_team_login"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    track_id: Mapped[int] = mapped_column(ForeignKey("tracks.id", ondelete="RESTRICT"), index=True)
    invite_code_id: Mapped[int | None] = mapped_column(
        ForeignKey("invite_codes.id", ondelete="SET NULL"),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    captain_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)

    login: Mapped[str] = mapped_column(String(64), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    event: Mapped["Event"] = relationship("Event", back_populates="teams")
    track: Mapped["Track"] = relationship("Track", back_populates="teams")
    invite_code: Mapped["InviteCode | None"] = relationship("InviteCode", back_populates="team")
