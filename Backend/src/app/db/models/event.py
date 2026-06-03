from datetime import datetime

from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.db.models.enums import EventFormat, EventStatus

if TYPE_CHECKING:
    from app.db.models.invite_code import InviteCode
    from app.db.models.team import Team
    from app.db.models.track import Track


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    keywords: Mapped[str] = mapped_column(Text, default="", nullable=False)
    brand: Mapped[str] = mapped_column(String(64), default="", nullable=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[str] = mapped_column(String(512), default="", nullable=False)
    format: Mapped[EventFormat | None] = mapped_column(
        Enum(
            EventFormat,
            name="event_format",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=True,
    )
    min_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[EventStatus] = mapped_column(
        Enum(
            EventStatus,
            name="event_status",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=EventStatus.DRAFT,
        nullable=False,
    )

    tracks: Mapped[list["Track"]] = relationship(
        "Track",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    invite_codes: Mapped[list["InviteCode"]] = relationship(
        "InviteCode",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    teams: Mapped[list["Team"]] = relationship("Team", back_populates="event")
