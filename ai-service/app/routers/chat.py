from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.common import ApiResponse
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/api/v1/ai", tags=["Fitness Chat"])

@router.post("/chat", response_model=ApiResponse[ChatResponse])
async def chat_endpoint(request: ChatRequest):
    """
    Generate an AI chat response maintaining multi-turn context and persona.
    """
    reply_text = GeminiService.chat_response(
        system_instruction=request.systemInstruction,
        history=request.history,
        message=request.message,
        model=request.model,
    )

    return ApiResponse[ChatResponse](
        success=True,
        data=ChatResponse(response=reply_text),
    )
