from fastapi import APIRouter
from app.schemas.common import (
    GenerateTextRequest,
    GenerateTextResponse,
    GenerateJsonRequest,
    GenerateJsonResponse,
    ApiResponse,
)
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/api/v1/ai", tags=["General AI"])

@router.post("/generate-text", response_model=ApiResponse[GenerateTextResponse])
async def generate_text_endpoint(request: GenerateTextRequest):
    """
    Generate plain text response from prompt.
    """
    text = GeminiService.generate_text(prompt=request.prompt, model=request.model)
    return ApiResponse[GenerateTextResponse](
        success=True,
        data=GenerateTextResponse(text=text),
    )

@router.post("/generate-json", response_model=ApiResponse[GenerateJsonResponse])
async def generate_json_endpoint(request: GenerateJsonRequest):
    """
    Generate structured JSON response from prompt.
    """
    json_data = GeminiService.generate_json(prompt=request.prompt, model=request.model)
    return ApiResponse[GenerateJsonResponse](
        success=True,
        data=GenerateJsonResponse(json_data=json_data),
    )
