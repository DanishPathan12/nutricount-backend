import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

// Initialize the GoogleGenAI client (used for in-process fallback)
const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not set in the environment variables. In-process AI features may fail.');
}

export const ai = new GoogleGenAI({
  apiKey: apiKey || 'PLACEHOLDER_KEY',
});

/**
 * Helper to retry transient API errors (e.g. 503 high demand, 429 rate limits).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isTransient =
        error?.status === 503 ||
        error?.code === 503 ||
        error?.status === 429 ||
        error?.code === 429 ||
        (typeof error?.message === 'string' &&
          (error.message.includes('503') ||
            error.message.includes('429') ||
            error.message.includes('high demand') ||
            error.message.includes('UNAVAILABLE')));

      if (isTransient && attempt < retries - 1) {
        const delay = initialDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Service class for Gemini AI features.
 * Dispatches to dedicated FastAPI AI microservice when running,
 * and seamlessly falls back to in-process GoogleGenAI client.
 */
export class GeminiService {
  /**
   * Helper to call the FastAPI AI microservice.
   * Returns null if service is offline/unreachable so in-process fallback runs.
   */
  private static async callAiService<T>(endpoint: string, payload: any): Promise<T | null> {
    if (!env.AI_SERVICE_URL) return null;
    try {
      const response = await axios.post(`${env.AI_SERVICE_URL}${endpoint}`, payload, {
        timeout: 45000,
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data && response.data.success) {
        return response.data.data as T;
      }
    } catch (error: any) {
      // If service is not running or connection refused, log info and fallback
      if (error?.code !== 'ECONNREFUSED' && error?.code !== 'ENOTFOUND') {
        console.warn(`[AI-Service] Call to ${env.AI_SERVICE_URL}${endpoint} returned error, falling back:`, error?.message || error);
      }
    }
    return null;
  }

  /**
   * Generates a text response from the Gemini model.
   */
  static async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    // 1. Try FastAPI AI microservice
    const remote = await this.callAiService<{ text: string }>('/api/v1/ai/generate-text', { prompt, model });
    if (remote?.text) {
      return remote.text;
    }

    // 2. In-process fallback
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    return withRetry(async () => {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        return response.text || '';
      } catch (error) {
        console.error('Error generating text with Gemini:', error);
        throw error;
      }
    });
  }

  /**
   * Generates a structured JSON response from the Gemini model.
   */
  static async generateJSON<T>(
    prompt: string,
    responseSchema?: any,
    model: string = 'gemini-2.5-flash'
  ): Promise<T> {
    // 1. Try FastAPI AI microservice
    const remote = await this.callAiService<{ json_data: T }>('/api/v1/ai/generate-json', { prompt, model });
    if (remote?.json_data) {
      return remote.json_data;
    }

    // 2. In-process fallback
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    return withRetry(async () => {
      try {
        const config: any = {
          responseMimeType: 'application/json',
        };

        if (responseSchema) {
          config.responseSchema = responseSchema;
        }

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        const text = response.text || '{}';
        return JSON.parse(text) as T;
      } catch (error) {
        console.error('Error generating structured JSON with Gemini:', error);
        throw error;
      }
    });
  }

  /**
   * Generates a conversational response preserving multi-turn chat history.
   */
  static async generateChatResponse(
    systemInstruction: string,
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    newMessage: string,
    model: string = 'gemini-2.5-flash'
  ): Promise<string> {
    // 1. Try FastAPI AI microservice
    const remote = await this.callAiService<{ response: string }>('/api/v1/ai/chat', {
      systemInstruction,
      history,
      message: newMessage,
      model,
    });
    if (remote?.response) {
      return remote.response;
    }

    // 2. In-process fallback
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    return withRetry(async () => {
      try {
        const formattedHistory = history
          .filter((item) => item.role === 'user' || item.role === 'assistant')
          .map((item) => ({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }],
          }));

        const chat = ai.chats.create({
          model,
          config: {
            systemInstruction,
          },
          history: formattedHistory,
        });

        const response = await chat.sendMessage({ message: newMessage });
        return response.text || '';
      } catch (error: any) {
        console.warn('ai.chats attempt failed, attempting fallback prompt:', error?.message || error);
        let fullPrompt = `${systemInstruction}\n\n`;
        if (history.length > 0) {
          fullPrompt += `--- Conversation History ---\n`;
          for (const msg of history) {
            const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
            fullPrompt += `${roleLabel}: ${msg.content}\n`;
          }
          fullPrompt += `--- End of History ---\n\n`;
        }
        fullPrompt += `User: ${newMessage}\nAssistant:`;

        const response = await ai.models.generateContent({
          model,
          contents: fullPrompt,
        });
        return response.text || '';
      }
    });
  }

  /**
   * Analyzes an uploaded meal image and/or user meal notes to extract nutrition breakdown.
   */
  static async analyzeMeal(params: AnalyzeMealParams): Promise<MealNutritionAnalysis> {
    const {
      imageBuffer,
      imageBase64,
      mimeType = 'image/jpeg',
      notes,
      mealType,
      model = 'gemini-2.5-flash',
    } = params;

    let base64Data = '';
    if (imageBuffer) {
      base64Data = imageBuffer.toString('base64');
    } else if (imageBase64) {
      base64Data = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    }

    // 1. Try FastAPI AI microservice
    const remote = await this.callAiService<MealNutritionAnalysis>('/api/v1/ai/analyze-meal', {
      imageBase64: base64Data || undefined,
      mimeType,
      notes: notes || undefined,
      mealType: mealType || undefined,
      model,
    });
    if (remote && remote.mealName) {
      return remote;
    }

    // 2. In-process fallback
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const prompt = `You are a certified sports and clinical nutritionist AI.
Analyze the meal from the provided food image and/or user notes.
${notes ? `User notes: "${notes}"` : ''}
${mealType ? `Selected meal category: "${mealType}"` : ''}

Task:
1. Identify all food items, ingredients, and visible portions.
2. Estimate accurate total calories (kcal) and macronutrients: protein (g), carbs (g), fat (g), fiber (g), and sugar (g).
3. Provide an itemized breakdown for each component with its portion and calorie/macro contribution.
4. Assign an overall healthiness score from 1 (unhealthy) to 10 (exceptionally healthy/balanced).
5. Give a concise nutritionist feedback note.

Respond ONLY with a valid JSON object matching this schema:
{
  "mealName": "Name of the meal (e.g. Avocado Toast with Poached Eggs)",
  "mealType": "breakfast" | "lunch" | "dinner" | "snack" | "other",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "healthScore": number,
  "confidence": "high" | "medium" | "low",
  "aiNotes": "Brief nutritionist analysis and tip",
  "breakdown": [
    {
      "foodItem": "Food item name",
      "portion": "e.g. 2 large eggs or 1 slice",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number
    }
  ]
}`;

    return withRetry(async () => {
      try {
        const contents: any[] = [];
        if (base64Data) {
          contents.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'image/jpeg',
            },
          });
        }
        contents.push({ text: prompt });

        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        let rawText = response.text || '{}';
        rawText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(rawText);

        return {
          mealName: parsed.mealName || 'Logged Meal',
          mealType: ['breakfast', 'lunch', 'dinner', 'snack', 'other'].includes(parsed.mealType)
            ? parsed.mealType
            : (mealType as any) || 'other',
          calories: Math.round(Number(parsed.calories) || 0),
          protein: Math.round((Number(parsed.protein) || 0) * 10) / 10,
          carbs: Math.round((Number(parsed.carbs) || 0) * 10) / 10,
          fat: Math.round((Number(parsed.fat) || 0) * 10) / 10,
          fiber: Math.round((Number(parsed.fiber) || 0) * 10) / 10,
          sugar: Math.round((Number(parsed.sugar) || 0) * 10) / 10,
          healthScore: Math.min(10, Math.max(1, Math.round(Number(parsed.healthScore) || 7))),
          confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
          aiNotes: parsed.aiNotes || '',
          breakdown: Array.isArray(parsed.breakdown)
            ? parsed.breakdown.map((item: any) => ({
                foodItem: String(item.foodItem || 'Item'),
                portion: String(item.portion || '1 serving'),
                calories: Math.round(Number(item.calories) || 0),
                protein: Math.round((Number(item.protein) || 0) * 10) / 10,
                carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
                fat: Math.round((Number(item.fat) || 0) * 10) / 10,
                fiber: Math.round((Number(item.fiber) || 0) * 10) / 10,
                sugar: Math.round((Number(item.sugar) || 0) * 10) / 10,
              }))
            : [],
        };
      } catch (error) {
        console.error('Error analyzing meal with Gemini:', error);
        throw error;
      }
    });
  }
}

export interface MealItemBreakdown {
  foodItem: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface MealNutritionAnalysis {
  mealName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  healthScore: number;
  breakdown: MealItemBreakdown[];
  aiNotes: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AnalyzeMealParams {
  imageBuffer?: Buffer;
  imageBase64?: string;
  mimeType?: string;
  notes?: string | null;
  mealType?: string | null;
  model?: string;
}
