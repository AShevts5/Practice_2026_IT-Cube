from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

class Track(Base, TimestampMixin):
    __tablename__ = "tracks"
    __table_args__ = (UniqueConstraint("event_id", "slug", name="uq_track_event_slug"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    team_limit: Mapped[int] = mapped_column(Integer, nullable=False)

    event: Mapped["Event"] = relationship("Event", back_populates="tracks")
    teams: Mapped[list["Team"]] = relationship("Team", back_populates="track")
