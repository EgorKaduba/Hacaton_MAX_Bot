from pydantic import BaseModel


class ChatRequest(BaseModel):
    max_user_id: int = 1
    message: str


class ChatResponse(BaseModel):
    answer: str