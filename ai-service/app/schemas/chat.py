from typing import Literal
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"] = Field(..., description="Role of the sender")
    content: str = Field(..., description="Message text content")

class ChatRequest(BaseModel):
    systemInstruction: str | None = Field(None, description="System instructions / persona")
    history: list[ChatMessage] = Field(default_factory=list, description="Prior conversation messages")
    message: str = Field(..., description="New user message")
    model: str = Field("gemini-2.5-flash", description="Gemini model name")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Assistant response text")
