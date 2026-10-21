import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  chatSessions,
  chatMessages,
  type ChatSession,
  type NewChatSession,
  type ChatMessage,
  type NewChatMessage,
} from '../../db/schema/chat';

export class FitnessChatRepository {
  /**
   * Create a new chat session for a user.
   */
  async createSession(userId: string, title: string = 'New Chat'): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values({
        userId,
        title,
      })
      .returning();
    return session;
  }

  /**
   * Find a session by its ID.
   */
  async findSessionById(sessionId: string): Promise<ChatSession | null> {
    const result = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find a session by ID and ensure it belongs to the given user.
   */
  async findSessionByIdAndUserId(sessionId: string, userId: string): Promise<ChatSession | null> {
    const result = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  /**
   * List sessions for a user ordered by updatedAt descending.
   */
  async findUserSessions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatSession[]> {
    return db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count total sessions for a user.
   */
  async countUserSessions(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));
    return Number(result[0]?.count || 0);
  }

  /**
   * Update a session title.
   */
  async updateSessionTitle(
    sessionId: string,
    userId: string,
    title: string
  ): Promise<ChatSession | null> {
    const [updated] = await db
      .update(chatSessions)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .returning();
    return updated || null;
  }

  /**
   * Touch session to update updatedAt timestamp.
   */
  async touchSession(sessionId: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }

  /**
   * Delete a session by ID and ensure user ownership.
   * Associated chat messages are deleted via ON DELETE CASCADE foreign key.
   */
  async deleteSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    const [deleted] = await db
      .delete(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
      .returning();
    return deleted || null;
  }

  /**
   * Delete all sessions belonging to a user.
   */
  async deleteAllUserSessions(userId: string): Promise<ChatSession[]> {
    return db
      .delete(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .returning();
  }

  /**
   * Insert a new chat message into a session.
   */
  async createMessage(data: {
    sessionId: string;
    userId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  }): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(data)
      .returning();
    return message;
  }

  /**
   * Get all messages for a session ordered chronologically.
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Count total messages in a session.
   */
  async countSessionMessages(sessionId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));
    return Number(result[0]?.count || 0);
  }

  /**
   * Get recent messages for AI chat context (returns in chronological order).
   */
  async getRecentSessionMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return messages.reverse();
  }
}
