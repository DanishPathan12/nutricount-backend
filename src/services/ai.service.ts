import { AppError } from '../utils/errors';

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

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatTaskPayload {
  sessionId: string;
  userId: string;
  message: string;
  systemInstruction?: string;
  history?: ChatHistoryMessage[];
}

export interface MealAnalysisTaskPayload {
  mealId: string;
  userId: string;
  imageUrl?: string | null;
  notes?: string | null;
  mealType?: string | null;
}

/**
 * Service for AI processing tasks.
 * All direct HTTP calls to the AI microservice have been completely removed.
 * Asynchronous task queuing (e.g. RabbitMQ) will be hooked in here.
 */
export class AiService {
  /**
   * Queue a chat completion task for asynchronous processing.
   * (RabbitMQ producer will publish this task once configured)
   */
  static async queueChatTask(payload: ChatTaskPayload): Promise<void> {
    // TODO: Publish payload to RabbitMQ chat queue for async AI processing
    console.log(`[AiService] Queued chat task for session ${payload.sessionId} (awaiting RabbitMQ setup)`);
  }

  /**
   * Queue a meal analysis task for asynchronous processing.
   * (RabbitMQ producer will publish this task once configured)
   */
  static async queueMealAnalysisTask(payload: MealAnalysisTaskPayload): Promise<void> {
    // TODO: Publish payload to RabbitMQ meal analysis queue for async AI processing
    console.log(`[AiService] Queued meal analysis task for meal ${payload.mealId} (awaiting RabbitMQ setup)`);
  }

  /**
   * Direct synchronous HTTP calls to AI services are disabled.
   * Tasks are processed asynchronously via RabbitMQ.
   */
  static async generateChatResponse(
    _systemInstruction: string,
    _history: ChatHistoryMessage[],
    _newMessage: string,
    _model?: string
  ): Promise<string> {
    throw new AppError(
      'Direct HTTP calls to AI service are disabled. Chat responses are processed asynchronously via RabbitMQ.',
      501
    );
  }

  /**
   * Direct synchronous HTTP calls to AI services are disabled.
   * Tasks are processed asynchronously via RabbitMQ.
   */
  static async analyzeMeal(_params: AnalyzeMealParams): Promise<MealNutritionAnalysis> {
    throw new AppError(
      'Direct HTTP calls to AI service are disabled. Meal image analysis is processed asynchronously via RabbitMQ.',
      501
    );
  }

  /**
   * Direct synchronous HTTP calls to AI services are disabled.
   */
  static async generateText(_prompt: string, _model?: string): Promise<string> {
    throw new AppError(
      'Direct HTTP calls to AI service are disabled. Text generation is processed asynchronously via RabbitMQ.',
      501
    );
  }

  /**
   * Direct synchronous HTTP calls to AI services are disabled.
   */
  static async generateJSON<T>(_prompt: string, _model?: string): Promise<T> {
    throw new AppError(
      'Direct HTTP calls to AI service are disabled. JSON generation is processed asynchronously via RabbitMQ.',
      501
    );
  }
}
