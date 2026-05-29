from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    login: str = Field(..., description="Team login or admin email")
    password: str

class OtpRequest(BaseModel):
    challenge_id: int
    channel: str = Field(default="email", pattern="^(email|sms)$")

class OtpVerifyRequest(BaseModel):
    challenge_id: int
    code: str = Field(..., min_length=4, max_length=8)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
