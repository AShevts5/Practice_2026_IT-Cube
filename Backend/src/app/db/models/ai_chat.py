from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class AiChatSession(Base, TimestampMixin):
    __tablename__ = "ai_chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    client_key: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_role: Mapped[str | None] = mapped_column(String(16), nullable=True)
    user_sub: Mapped[str | None] = mapped_column(String(64), nullable=True)

    messages: Mapped[list["AiChatMessage"]] = relationship(
        "AiChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AiChatMessage.id",
    )

class AiChatMessage(Base, TimestampMixin):
    __tablename__ = "ai_chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    session: Mapped["AiChatSession"] = relationship("AiChatSession", back_populates="messages")
