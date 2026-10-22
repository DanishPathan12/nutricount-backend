from typing import Any, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str | None = None
    data: T | None = None

class GenerateTextRequest(BaseModel):
    prompt: str = Field(..., description="Prompt to send to Gemini model")
    model: str = Field("gemini-2.5-flash", description="Gemini model name")

class GenerateTextResponse(BaseModel):
    text: str

class GenerateJsonRequest(BaseModel):
    prompt: str = Field(..., description="Prompt detailing instructions and JSON format")
    model: str = Field("gemini-2.5-flash", description="Gemini model name")

class GenerateJsonResponse(BaseModel):
    json_data: Any
