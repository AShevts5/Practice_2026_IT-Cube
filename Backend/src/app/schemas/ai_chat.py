from pydantic import BaseModel, Field

class AiChatSessionCreateRequest(BaseModel):
    client_key: str = Field(..., min_length=8, max_length=64)

class AiChatMessageSchema(BaseModel):
    id: int
    role: str
    content: str
    created_at: str

class AiChatSessionSchema(BaseModel):
    id: int
    client_key: str

class AiChatSessionResponse(BaseModel):
    session: AiChatSessionSchema
    messages: list[AiChatMessageSchema]
    suggested_questions: list[str]

class AiChatSendMessageRequest(BaseModel):
    client_key: str = Field(..., min_length=8, max_length=64)
    text: str = Field(..., min_length=1, max_length=2000)

class AiChatSendMessageResponse(BaseModel):
    user_message: AiChatMessageSchema
    assistant_message: AiChatMessageSchema
