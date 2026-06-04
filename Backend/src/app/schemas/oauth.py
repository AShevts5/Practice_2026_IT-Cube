from pydantic import BaseModel, Field
from app.core.validators import PhoneNumber

class OAuthCompleteRequest(BaseModel):
    signup_token: str = Field(..., min_length=10)
    full_name: str = Field(..., min_length=3, max_length=255)
    phone: PhoneNumber
