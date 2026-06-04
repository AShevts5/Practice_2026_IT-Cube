from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.db.models.ai_chat import AiChatMessage, AiChatSession
from app.integrations.llm.client import LlmClient, LlmMessage
from app.schemas.ai_chat import (
    AiChatMessageSchema,
    AiChatSendMessageResponse,
    AiChatSessionResponse,
    AiChatSessionSchema,
)

BOT_GREETING = "Приветствую Повелителя своего! Чем могу быть полезен?"

DEFAULT_SYSTEM_PROMPT = """Ты — AI-помощник платформы IT-Cube для регистрации команд на хакатоны.

Отвечай только на русском языке, кратко и по делу.

Ты помогаешь пользователям с:
- регистрацией капитана и команды на мероприятия;
- входом в личный кабинет капитана и команды;
- выбором кейса (трека) и статусами заявки;
- общими вопросами о работе платформы platformhackathons.ru.

Если вопрос не связан с платформой или ты не уверен в ответе — честно скажи об этом
и предложи обратиться к организаторам мероприятия.

Не выдумывай правила, даты и лимиты мест — если данных нет, так и скажи."""

SUGGESTED_QUESTIONS = [
    "Как зарегистрировать команду на хакатон?",
    "Как войти в личный кабинет?",
    "Как выбрать кейс для команды?",
    "Что делать, если не приходит код подтверждения?",
]


class AiChatService:
    def __init__(self, db: AsyncSession, llm: LlmClient | None = None) -> None:
        self.db = db
        self.llm = llm or LlmClient()

    async def start_session(
        self,
        client_key: str,
        *,
        user_role: str | None = None,
        user_sub: str | None = None,
    ) -> AiChatSessionResponse:
        if not settings.llm_enabled:
            raise ValidationError("AI-помощник временно отключён")

        session = AiChatSession(
            client_key=client_key.strip(),
            user_role=user_role,
            user_sub=user_sub,
        )
        self.db.add(session)
        await self.db.flush()

        greeting = AiChatMessage(
            session_id=session.id,
            role="assistant",
            content=settings.ai_chat_greeting.strip() or BOT_GREETING,
        )
        self.db.add(greeting)
        await self.db.flush()

        return AiChatSessionResponse(
            session=AiChatSessionSchema(id=session.id, client_key=session.client_key),
            messages=[self._to_message_schema(greeting)],
            suggested_questions=SUGGESTED_QUESTIONS,
        )

    async def get_session(self, session_id: int, client_key: str) -> AiChatSessionResponse:
        session = await self._get_session_for_client(session_id, client_key)
        return AiChatSessionResponse(
            session=AiChatSessionSchema(id=session.id, client_key=session.client_key),
            messages=[self._to_message_schema(msg) for msg in session.messages],
            suggested_questions=SUGGESTED_QUESTIONS,
        )

    async def send_message(
        self,
        session_id: int,
        *,
        client_key: str,
        text: str,
    ) -> AiChatSendMessageResponse:
        if not settings.llm_enabled:
            raise ValidationError("AI-помощник временно отключён")

        user_text = text.strip()
        if not user_text:
            raise ValidationError("Введите текст сообщения")

        session = await self._get_session_for_client(session_id, client_key)

        user_message = AiChatMessage(
            session_id=session.id,
            role="user",
            content=user_text,
        )
        self.db.add(user_message)
        await self.db.flush()

        llm_messages = self._build_llm_messages(session.messages + [user_message])
        assistant_text = await self.llm.chat(llm_messages)

        assistant_message = AiChatMessage(
            session_id=session.id,
            role="assistant",
            content=assistant_text,
        )
        self.db.add(assistant_message)
        await self.db.flush()

        return AiChatSendMessageResponse(
            user_message=self._to_message_schema(user_message),
            assistant_message=self._to_message_schema(assistant_message),
        )

    async def _get_session_for_client(self, session_id: int, client_key: str) -> AiChatSession:
        result = await self.db.execute(
            select(AiChatSession)
            .where(
                AiChatSession.id == session_id,
                AiChatSession.client_key == client_key.strip(),
            )
            .options(selectinload(AiChatSession.messages))
        )
        session = result.scalar_one_or_none()
        if session is None:
            raise NotFoundError("Сессия чата не найдена")
        return session

    def _build_llm_messages(self, history: list[AiChatMessage]) -> list[LlmMessage]:
        system_prompt = settings.ai_chat_system_prompt or DEFAULT_SYSTEM_PROMPT
        messages: list[LlmMessage] = [LlmMessage(role="system", content=system_prompt)]

        recent = history[-settings.ai_chat_max_history :]
        for item in recent:
            if item.role not in {"user", "assistant"}:
                continue
            messages.append(LlmMessage(role=item.role, content=item.content))
        return messages

    @staticmethod
    def _to_message_schema(message: AiChatMessage) -> AiChatMessageSchema:
        return AiChatMessageSchema(
            id=message.id,
            role=message.role,
            content=message.content,
            created_at=message.created_at.isoformat(),
        )
