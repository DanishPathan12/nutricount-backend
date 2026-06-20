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
 * Service class for Gemini AI features.
 */
export class GeminiService {
  /**
   * Generates a text response from the Gemini model.
   * @param prompt The prompt to send to the Gemini model.
   * @param model Optional model name. Defaults to 'gemini-2.0-flash'.
   */
  static async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

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
  }

  /**
   * Generates a structured JSON response from the Gemini model.
   * @param prompt The prompt detailing the instructions and output schema.
   * @param responseSchema Optional Zod or JSON schema description to enforce JSON output.
   * @param model Optional model name. Defaults to 'gemini-2.0-flash'.
   */
  static async generateJSON<T>(
    prompt: string,
    responseSchema?: any,
    model: string = 'gemini-2.5-flash'
  ): Promise<T> {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

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
  }

  /**
   * Analyzes an image and returns structured JSON response.
   * @param prompt The text prompt/instructions.
   * @param imageBuffer The image file buffer.
   * @param mimeType The image mime type (e.g. image/jpeg, image/png).
   * @param responseSchema Optional schema to enforce output.
   * @param model Optional model name. Defaults to 'gemini-2.5-flash'.
   */
  static async analyzeImage<T>(
    prompt: string,
    imageBuffer: Buffer,
    mimeType: string,
    responseSchema?: any,
    model: string = 'gemini-2.5-flash'
  ): Promise<T> {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    try {
      const config: any = {
        responseMimeType: 'application/json',
      };

      if (responseSchema) {
        config.responseSchema = responseSchema;
      }

      const base64Data = imageBuffer.toString('base64');

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
        config,
      });

      const text = response.text || '{}';
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Error in analyzeImage with Gemini:', error);
      throw error;
    }
  }
}

