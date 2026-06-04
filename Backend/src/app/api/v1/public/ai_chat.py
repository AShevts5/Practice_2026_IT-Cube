from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies_optional import OptionalUserIdentity, get_optional_user_identity
from app.schemas.ai_chat import (
    AiChatSendMessageRequest,
    AiChatSendMessageResponse,
    AiChatSessionCreateRequest,
    AiChatSessionResponse,
)
from app.services.ai_chat_service import AiChatService

router = APIRouter()

@router.post("/sessions", response_model=AiChatSessionResponse, status_code=201)
async def start_ai_chat_session(
    body: AiChatSessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    identity: Annotated[OptionalUserIdentity | None, Depends(get_optional_user_identity)] = None,
) -> AiChatSessionResponse:
    return await AiChatService(db).start_session(
        body.client_key,
        user_role=identity.role if identity else None,
        user_sub=identity.sub if identity else None,
    )

@router.get("/sessions/{session_id}", response_model=AiChatSessionResponse)
async def get_ai_chat_session(
    session_id: int,
    client_key: str = Query(..., min_length=8, max_length=64),
    db: AsyncSession = Depends(get_db),
) -> AiChatSessionResponse:
    return await AiChatService(db).get_session(session_id, client_key)

@router.post("/sessions/{session_id}/messages", response_model=AiChatSendMessageResponse)
async def send_ai_chat_message(
    session_id: int,
    body: AiChatSendMessageRequest,
    db: AsyncSession = Depends(get_db),
) -> AiChatSendMessageResponse:
    return await AiChatService(db).send_message(
        session_id,
        client_key=body.client_key,
        text=body.text,
    )
