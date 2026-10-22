from typing import Literal
from pydantic import BaseModel, Field

class MealItemBreakdown(BaseModel):
    foodItem: str = Field(..., description="Name of the food item / ingredient")
    portion: str = Field("1 serving", description="Estimated portion size")
    calories: float = Field(0.0, description="Estimated calories in kcal")
    protein: float = Field(0.0, description="Protein in grams")
    carbs: float = Field(0.0, description="Carbohydrates in grams")
    fat: float = Field(0.0, description="Fat in grams")
    fiber: float = Field(0.0, description="Fiber in grams")
    sugar: float = Field(0.0, description="Sugar in grams")

class MealNutritionAnalysis(BaseModel):
    mealName: str = Field(..., description="Concise, descriptive meal title")
    mealType: Literal["breakfast", "lunch", "dinner", "snack", "other"] = Field("other")
    calories: float = Field(..., description="Total estimated calories (kcal)")
    protein: float = Field(..., description="Total protein (g)")
    carbs: float = Field(..., description="Total carbohydrates (g)")
    fat: float = Field(..., description="Total fat (g)")
    fiber: float = Field(0.0, description="Total fiber (g)")
    sugar: float = Field(0.0, description="Total sugar (g)")
    healthScore: int = Field(7, ge=1, le=10, description="Nutritional healthiness rating (1-10)")
    confidence: Literal["high", "medium", "low"] = Field("medium")
    aiNotes: str = Field("", description="Nutritionist feedback and tips")
    breakdown: list[MealItemBreakdown] = Field(default_factory=list, description="Itemized food components")

class AnalyzeMealJsonRequest(BaseModel):
    imageBase64: str | None = Field(None, description="Base64 encoded meal photo (with or without data URI prefix)")
    mimeType: str = Field("image/jpeg", description="MIME type of the image")
    notes: str | None = Field(None, description="Optional user meal description or notes")
    mealType: str | None = Field(None, description="Optional meal type hint")
    model: str = Field("gemini-2.5-flash", description="Gemini model name")

class AnalyzeMealResponse(BaseModel):
    success: bool = True
    data: MealNutritionAnalysis
