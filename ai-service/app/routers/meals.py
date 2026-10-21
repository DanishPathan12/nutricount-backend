import base64
import re
from typing import Annotated
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.schemas.meal import (
    AnalyzeMealJsonRequest,
    MealNutritionAnalysis,
    AnalyzeMealResponse,
)
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/api/v1/ai", tags=["Meal Analysis"])

def decode_base64_image(base64_str: str) -> tuple[bytes, str]:
    """Extract bytes and mime type from base64 string or data URI."""
    mime_type = "image/jpeg"
    match = re.match(r"^data:(image/[a-zA-Z0-9+.-]+);base64,", base64_str)
    if match:
        mime_type = match.group(1)
    pure_base64 = re.sub(r"^data:image/[a-zA-Z0-9+.-]+;base64,", "", base64_str).strip()
    try:
        raw_bytes = base64.b64decode(pure_base64)
        return raw_bytes, mime_type
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

@router.post("/analyze-meal", response_model=AnalyzeMealResponse)
async def analyze_meal_json(request: AnalyzeMealJsonRequest):
    """
    Analyze food image (base64) and/or notes to extract nutritional breakdown.
    """
    image_bytes = None
    mime_type = request.mimeType or "image/jpeg"

    if request.imageBase64:
        image_bytes, detected_mime = decode_base64_image(request.imageBase64)
        mime_type = detected_mime or mime_type

    analysis = GeminiService.analyze_meal(
        image_bytes=image_bytes,
        mime_type=mime_type,
        notes=request.notes,
        meal_type=request.mealType,
        model=request.model,
    )

    return AnalyzeMealResponse(success=True, data=analysis)

@router.post("/analyze-meal-upload", response_model=AnalyzeMealResponse)
async def analyze_meal_upload(
    image: Annotated[UploadFile | None, File()] = None,
    notes: Annotated[str | None, Form()] = None,
    mealType: Annotated[str | None, Form()] = None,
    model: Annotated[str, Form()] = "gemini-2.5-flash",
):
    """
    Analyze food image uploaded as multipart form-data.
    """
    image_bytes = None
    mime_type = "image/jpeg"

    if image:
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        image_bytes = await image.read()
        mime_type = image.content_type

    analysis = GeminiService.analyze_meal(
        image_bytes=image_bytes,
        mime_type=mime_type,
        notes=notes,
        meal_type=mealType,
        model=model,
    )

    return AnalyzeMealResponse(success=True, data=analysis)
