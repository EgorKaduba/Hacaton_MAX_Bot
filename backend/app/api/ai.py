from fastapi import APIRouter

from ..deps import SessionDep
from ..schemas.ai import ChatRequest, ChatResponse
from ..tools.ai_service import ask_ai

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, session: SessionDep):
    answer = await ask_ai(
        session=session,
        max_user_id=request.max_user_id,
        message=request.message,
    )
    return ChatResponse(answer=answer)