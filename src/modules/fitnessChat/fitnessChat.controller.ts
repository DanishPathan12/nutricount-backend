import { Request, Response, NextFunction } from 'express';
import { FitnessChatService } from './fitnessChat.service';
import {
  SendMessageSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  PaginationQuerySchema,
  SessionIdParamSchema,
} from './fitnessChat.schema';

export class FitnessChatController {
  private service: FitnessChatService;

  constructor() {
    this.service = new FitnessChatService();
  }

  /**
   * Send a message / ask a question.
   * If sessionId is provided in body, appends to that session.
   * If not provided, a new session is auto-created.
   */
  askQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, sessionId } = SendMessageSchema.parse(req.body);
      const userId = req.user!.userId;

      const result = await this.service.sendMessage(userId, message, sessionId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Explicitly create a new chat session.
   */
  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title } = CreateSessionSchema.parse(req.body || {});
      const userId = req.user!.userId;

      const session = await this.service.createSession(userId, title);

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all chat sessions for the authenticated user (paginated).
   */
  getSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { limit, offset } = PaginationQuerySchema.parse(req.query);
      const userId = req.user!.userId;

      const result = await this.service.getUserSessions(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific session and its full message history.
   */
  getSessionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = SessionIdParamSchema.parse(req.params);
      const { limit, offset } = PaginationQuerySchema.parse(req.query);
      const userId = req.user!.userId;

      const result = await this.service.getSessionWithMessages(sessionId, userId, limit, offset);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get only messages for a specific session.
   */
  getSessionMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = SessionIdParamSchema.parse(req.params);
      const { limit, offset } = PaginationQuerySchema.parse(req.query);
      const userId = req.user!.userId;

      const messages = await this.service.getSessionMessages(sessionId, userId, limit, offset);

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a message to an explicit session via URL param.
   */
  sendMessageToSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = SessionIdParamSchema.parse(req.params);
      const { message } = SendMessageSchema.parse({ ...req.body, sessionId });
      const userId = req.user!.userId;

      const result = await this.service.sendMessage(userId, message, sessionId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Rename / update a chat session's title.
   */
  updateSessionTitle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = SessionIdParamSchema.parse(req.params);
      const { title } = UpdateSessionSchema.parse(req.body);
      const userId = req.user!.userId;

      const session = await this.service.updateSessionTitle(sessionId, userId, title);

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a specific chat session and all its messages.
   */
  deleteSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = SessionIdParamSchema.parse(req.params);
      const userId = req.user!.userId;

      await this.service.deleteSession(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Chat session deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clear all chat sessions and history for the authenticated user.
   */
  clearAllSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const count = await this.service.clearUserHistory(userId);

      res.status(200).json({
        success: true,
        message: `Deleted ${count} chat session(s) successfully`,
      });
    } catch (error) {
      next(error);
    }
  };
}
