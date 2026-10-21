import json
import logging
import re
import time
from typing import Any
from fastapi import HTTPException
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import settings
from app.schemas.meal import MealNutritionAnalysis, MealItemBreakdown
from app.schemas.chat import ChatMessage

logger = logging.getLogger("ai_service.gemini")

def clean_json_string(raw_text: str) -> str:
    """Strip markdown code fence wrapper (```json ... ```) if present."""
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

class GeminiService:
    @staticmethod
    def get_client() -> genai.Client:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="GEMINI_API_KEY is not configured on the AI service."
            )
        return genai.Client(api_key=settings.GEMINI_API_KEY)

    @classmethod
    def with_retry(cls, fn, retries: int = 3, initial_delay: float = 1.0):
        last_error = None
        for attempt in range(retries):
            try:
                return fn()
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                is_transient = (
                    "503" in err_str
                    or "429" in err_str
                    or "high demand" in err_str
                    or "unavailable" in err_str
                    or "resource_exhausted" in err_str
                )
                if is_transient and attempt < retries - 1:
                    sleep_time = initial_delay * (2 ** attempt)
                    logger.warning(f"Transient Gemini API error ({e}). Retrying in {sleep_time}s...")
                    time.sleep(sleep_time)
                    continue
                raise e
        raise last_error

    @classmethod
    def analyze_meal(
        cls,
        image_bytes: bytes | None = None,
        mime_type: str = "image/jpeg",
        notes: str | None = None,
        meal_type: str | None = None,
        model: str | None = None,
    ) -> MealNutritionAnalysis:
        """
        Analyze meal image and/or user meal notes to extract nutrition breakdown.
        """
        client = cls.get_client()
        target_model = model or settings.DEFAULT_MODEL

        prompt = f"""You are a certified sports and clinical nutritionist AI.
Analyze the meal from the provided food image and/or user notes.
{f'User notes: "{notes}"' if notes else ''}
{f'Selected meal category: "{meal_type}"' if meal_type else ''}

Task:
1. Identify all food items, ingredients, and visible portions.
2. Estimate accurate total calories (kcal) and macronutrients: protein (g), carbs (g), fat (g), fiber (g), and sugar (g).
3. Provide an itemized breakdown for each component with its portion and calorie/macro contribution.
4. Assign an overall healthiness score from 1 (unhealthy) to 10 (exceptionally healthy/balanced).
5. Give a concise nutritionist feedback note.

Respond ONLY with a valid JSON object matching this schema:
{{
  "mealName": "Name of the meal (e.g. Avocado Toast with Poached Eggs)",
  "mealType": "breakfast" | "lunch" | "dinner" | "snack" | "other",
  "calories": 450,
  "protein": 24,
  "carbs": 35,
  "fat": 18,
  "fiber": 6,
  "sugar": 3,
  "healthScore": 8,
  "confidence": "high" | "medium" | "low",
  "aiNotes": "Brief nutritionist analysis and tip",
  "breakdown": [
    {{
      "foodItem": "Food item name",
      "portion": "e.g. 2 large eggs or 1 slice",
      "calories": 140,
      "protein": 12,
      "carbs": 1,
      "fat": 10,
      "fiber": 0,
      "sugar": 0
    }}
  ]
}}"""

        def _execute():
            contents = []
            if image_bytes:
                contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
            contents.append(prompt)

            response = client.models.generate_content(
                model=target_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            raw_text = clean_json_string(response.text or "{}")
            return json.loads(raw_text)

        try:
            parsed = cls.with_retry(_execute)
        except Exception as e:
            logger.error(f"Error analyzing meal with Gemini: {e}")
            raise HTTPException(status_code=500, detail=f"AI meal analysis failed: {str(e)}")

        # Normalize and construct MealNutritionAnalysis
        raw_items = parsed.get("breakdown", [])
        breakdown_items = []
        if isinstance(raw_items, list):
            for item in raw_items:
                if isinstance(item, dict):
                    breakdown_items.append(
                        MealItemBreakdown(
                            foodItem=str(item.get("foodItem") or "Item"),
                            portion=str(item.get("portion") or "1 serving"),
                            calories=round(float(item.get("calories") or 0)),
                            protein=round(float(item.get("protein") or 0), 1),
                            carbs=round(float(item.get("carbs") or 0), 1),
                            fat=round(float(item.get("fat") or 0), 1),
                            fiber=round(float(item.get("fiber") or 0), 1),
                            sugar=round(float(item.get("sugar") or 0), 1),
                        )
                    )

        allowed_meal_types = ["breakfast", "lunch", "dinner", "snack", "other"]
        parsed_type = parsed.get("mealType")
        if parsed_type not in allowed_meal_types:
            parsed_type = meal_type if meal_type in allowed_meal_types else "other"

        confidence_val = parsed.get("confidence")
        if confidence_val not in ["high", "medium", "low"]:
            confidence_val = "medium"

        health_score = int(parsed.get("healthScore") or 7)
        health_score = max(1, min(10, health_score))

        return MealNutritionAnalysis(
            mealName=str(parsed.get("mealName") or "Logged Meal"),
            mealType=parsed_type,
            calories=round(float(parsed.get("calories") or 0)),
            protein=round(float(parsed.get("protein") or 0), 1),
            carbs=round(float(parsed.get("carbs") or 0), 1),
            fat=round(float(parsed.get("fat") or 0), 1),
            fiber=round(float(parsed.get("fiber") or 0), 1),
            sugar=round(float(parsed.get("sugar") or 0), 1),
            healthScore=health_score,
            confidence=confidence_val,
            aiNotes=str(parsed.get("aiNotes") or ""),
            breakdown=breakdown_items,
        )

    @classmethod
    def chat_response(
        cls,
        system_instruction: str | None,
        history: list[ChatMessage],
        message: str,
        model: str | None = None,
    ) -> str:
        """
        Generates a multi-turn conversational response preserving chat history and persona.
        """
        client = cls.get_client()
        target_model = model or settings.DEFAULT_MODEL

        def _execute():
            # Build chat history for client.chats
            chat_history = []
            for item in history:
                if item.role in ["user", "assistant"]:
                    role = "model" if item.role == "assistant" else "user"
                    chat_history.append(
                        types.Content(
                            role=role,
                            parts=[types.Part.from_text(text=item.content)]
                        )
                    )

            config = None
            if system_instruction:
                config = types.GenerateContentConfig(system_instruction=system_instruction)

            try:
                chat = client.chats.create(
                    model=target_model,
                    history=chat_history if chat_history else None,
                    config=config,
                )
                response = chat.send_message(message=message)
                return response.text or ""
            except Exception as chat_err:
                logger.warning(f"client.chats failed, using prompt fallback: {chat_err}")
                # Fallback: flatten conversation into single prompt
                prompt_parts = []
                if system_instruction:
                    prompt_parts.append(f"{system_instruction}\n")
                if history:
                    prompt_parts.append("--- Conversation History ---")
                    for h in history:
                        sender = "User" if h.role == "user" else "Assistant"
                        prompt_parts.append(f"{sender}: {h.content}")
                    prompt_parts.append("--- End of History ---\n")
                prompt_parts.append(f"User: {message}\nAssistant:")
                full_prompt = "\n".join(prompt_parts)

                response = client.models.generate_content(
                    model=target_model,
                    contents=full_prompt,
                )
                return response.text or ""

        try:
            return cls.with_retry(_execute)
        except Exception as e:
            logger.error(f"Error in chat_response: {e}")
            raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")

    @classmethod
    def generate_text(cls, prompt: str, model: str | None = None) -> str:
        """Simple text generation."""
        client = cls.get_client()
        target_model = model or settings.DEFAULT_MODEL

        def _execute():
            response = client.models.generate_content(
                model=target_model,
                contents=prompt,
            )
            return response.text or ""

        try:
            return cls.with_retry(_execute)
        except Exception as e:
            logger.error(f"Error generating text: {e}")
            raise HTTPException(status_code=500, detail=f"Text generation failed: {str(e)}")

    @classmethod
    def generate_json(cls, prompt: str, model: str | None = None) -> Any:
        """JSON output generation."""
        client = cls.get_client()
        target_model = model or settings.DEFAULT_MODEL

        def _execute():
            response = client.models.generate_content(
                model=target_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            raw = clean_json_string(response.text or "{}")
            return json.loads(raw)

        try:
            return cls.with_retry(_execute)
        except Exception as e:
            logger.error(f"Error generating JSON: {e}")
            raise HTTPException(status_code=500, detail=f"JSON generation failed: {str(e)}")
