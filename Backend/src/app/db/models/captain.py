from datetime import datetime
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Captain(Base, TimestampMixin):
    __tablename__ = "captains"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    team_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    team: Mapped["Team | None"] = relationship("Team", foreign_keys=[team_id])
    oauth_accounts: Mapped[list["CaptainOAuthAccount"]] = relationship(
        "CaptainOAuthAccount",
        back_populates="captain",
        cascade="all, delete-orphan",
    )
