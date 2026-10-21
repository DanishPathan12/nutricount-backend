import { FitnessChatRepository } from './fitnessChat.repository';
import { UserProfilesService } from '../userProfiles/userProfiles.service';
import { AiService } from '../../services/ai.service';
import { AppError } from '../../utils/errors';
import type { ChatSession, ChatMessage } from '../../db/schema/chat';

export class FitnessChatService {
  private repository: FitnessChatRepository;
  private userProfilesService: UserProfilesService;

  constructor() {
    this.repository = new FitnessChatRepository();
    this.userProfilesService = new UserProfilesService();
  }

  /**
   * Create an explicit new chat session.
   */
  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const sessionTitle = title?.trim() || 'New Chat';
    return this.repository.createSession(userId, sessionTitle);
  }

  /**
   * Get all chat sessions for a user with pagination.
   */
  async getUserSessions(userId: string, limit: number = 20, offset: number = 0) {
    const [sessions, total] = await Promise.all([
      this.repository.findUserSessions(userId, limit, offset),
      this.repository.countUserSessions(userId),
    ]);

    return {
      sessions,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get a specific session with its messages.
   */
  async getSessionWithMessages(
    sessionId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    const session = await this.repository.findSessionByIdAndUserId(sessionId, userId);
    if (!session) {
      throw new AppError('Chat session not found', 404);
    }

    const [messages, totalMessages] = await Promise.all([
      this.repository.getSessionMessages(sessionId, limit, offset),
      this.repository.countSessionMessages(sessionId),
    ]);

    return {
      session,
      messages,
      totalMessages,
      limit,
      offset,
    };
  }

  /**
   * Get messages for a session.
   */
  async getSessionMessages(
    sessionId: string,
    userId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    const session = await this.repository.findSessionByIdAndUserId(sessionId, userId);
    if (!session) {
      throw new AppError('Chat session not found', 404);
    }

    return this.repository.getSessionMessages(sessionId, limit, offset);
  }

  /**
   * Update the title of a chat session.
   */
  async updateSessionTitle(sessionId: string, userId: string, title: string): Promise<ChatSession> {
    const updated = await this.repository.updateSessionTitle(sessionId, userId, title);
    if (!updated) {
      throw new AppError('Chat session not found', 404);
    }
    return updated;
  }

  /**
   * Delete a chat session and all its messages.
   */
  async deleteSession(sessionId: string, userId: string): Promise<ChatSession> {
    const deleted = await this.repository.deleteSession(sessionId, userId);
    if (!deleted) {
      throw new AppError('Chat session not found', 404);
    }
    return deleted;
  }

  /**
   * Clear all chat sessions and history for a user.
   */
  async clearUserHistory(userId: string): Promise<number> {
    const deletedSessions = await this.repository.deleteAllUserSessions(userId);
    return deletedSessions.length;
  }

  /**
   * Send a message within a session (or create a new session if none provided),
   * query AI microservice with user profile context and multi-turn conversation history,
   * persist both user message and AI response, and return the result.
   */
  async sendMessage(userId: string, message: string, sessionId?: string) {
    let session: ChatSession;

    if (sessionId) {
      const existingSession = await this.repository.findSessionByIdAndUserId(sessionId, userId);
      if (!existingSession) {
        throw new AppError('Chat session not found', 404);
      }
      session = existingSession;
    } else {
      // Auto-generate title from first 40 chars of question
      const cleanMessage = message.trim();
      const generatedTitle =
        cleanMessage.length > 40 ? `${cleanMessage.slice(0, 40).trim()}...` : cleanMessage;
      session = await this.repository.createSession(userId, generatedTitle);
    }

    // 1. Fetch recent conversation history for this session (up to 10 messages)
    const recentHistory = await this.repository.getRecentSessionMessages(session.id, 10);

    // 2. Persist the user's message
    const userMessage = await this.repository.createMessage({
      sessionId: session.id,
      userId,
      role: 'user',
      content: message,
    });

    // 3. Fetch user's profile for personalized advice context
    let profile = null;
    try {
      profile = await this.userProfilesService.getProfileByUserId(userId);
    } catch {
      // Profile not set up yet
    }

    let profileContext = '';
    if (profile) {
      profileContext = `User Profile Context:
- Name: ${profile.firstName} ${profile.lastName}
- Age: ${profile.age} years old
- Gender: ${profile.gender}
- Height: ${profile.heightCm} cm
- Weight: ${profile.weightKg} kg
- Target Weight: ${profile.targetWeightKg ? `${profile.targetWeightKg} kg` : 'Not specified'}
- Activity Level: ${profile.activityLevel}
- Fitness/Nutrition Goal: ${profile.goal}
- Diet Type: ${profile.dietType}
- Allergies: ${profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}
- Disliked Foods: ${profile.dislikedFoods && profile.dislikedFoods.length > 0 ? profile.dislikedFoods.join(', ') : 'None'}
- Preferred Cuisine: ${profile.preferredCuisine && profile.preferredCuisine.length > 0 ? profile.preferredCuisine.join(', ') : 'None'}
- Health Conditions: ${profile.conditions && profile.conditions.length > 0 ? profile.conditions.join(', ') : 'None'}
- Medications: ${profile.medications && profile.medications.length > 0 ? profile.medications.join(', ') : 'None'}
- Lifestyle: Smoking - ${profile.smoking ? 'Yes' : 'No'}, Alcohol - ${profile.alcohol ? 'Yes' : 'No'}
- Workout Frequency: ${profile.workoutDaysPerWeek !== null ? `${profile.workoutDaysPerWeek} days/week` : 'Not specified'}
- Sleep: ${profile.sleepHours !== null ? `${profile.sleepHours} hours/night` : 'Not specified'}`;
    } else {
      profileContext = `User Profile Context:
- The user has not completed their profile setup yet. Avoid personalized metrics references, and politely remind/encourage them to set up their profile for tailored suggestions.`;
    }

    const systemInstruction = `You are a certified fitness trainer and expert nutritionist on the Nutricount app.
Your objective is to provide evidence-based, supportive, and clear answers to fitness, workout, diet, or nutrition questions.
Use the provided User Profile Context to personalize your advice where appropriate. If profile metrics are missing, provide general guidance and suggest completing their profile.
Keep your answer structured with clean markdown (using headers, bullet points, or bold text) to make it readable and user-friendly.

---
${profileContext}
---`;

    // 4. Queue chat task for async processing (to be handled via RabbitMQ)
    await AiService.queueChatTask({
      sessionId: session.id,
      userId,
      message,
      systemInstruction,
      history: recentHistory.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    });

    // 5. Update session updatedAt
    await this.repository.touchSession(session.id);

    return {
      sessionId: session.id,
      sessionTitle: session.title,
      userMessage,
      status: 'pending_async_processing',
      reply: null,
      response: null,
    };
  }
}
