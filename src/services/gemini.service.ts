import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';

// Initialize the GoogleGenAI client
// If the API key is not configured, we'll log a warning.
const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not set in the environment variables. AI features may fail.');
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
 */
export class GeminiService {
  /**
   * Generates a text response from the Gemini model.
   * @param prompt The prompt to send to the Gemini model.
   * @param model Optional model name. Defaults to 'gemini-2.5-flash'.
   */
  static async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
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
   * @param prompt The prompt detailing the instructions and output schema.
   * @param responseSchema Optional Zod or JSON schema description to enforce JSON output.
   * @param model Optional model name. Defaults to 'gemini-2.5-flash'.
   */
  static async generateJSON<T>(
    prompt: string,
    responseSchema?: any,
    model: string = 'gemini-2.5-flash'
  ): Promise<T> {
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
   * @param systemInstruction System instruction / persona / context.
   * @param history Previous messages in the session.
   * @param newMessage The user's new message.
   * @param model Optional model name. Defaults to 'gemini-2.5-flash'.
   */
  static async generateChatResponse(
    systemInstruction: string,
    history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    newMessage: string,
    model: string = 'gemini-2.5-flash'
  ): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    return withRetry(async () => {
      try {
        // Map history to Google GenAI Content format
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
        // Fallback: format history and system instruction into single prompt
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
}
