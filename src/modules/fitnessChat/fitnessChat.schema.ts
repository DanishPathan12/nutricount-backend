import { z } from 'zod';

export const SendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message is required'),
  sessionId: z.string().uuid('Invalid session ID format').optional(),
});

export const AskQuestionSchema = SendMessageSchema;

export const CreateSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be 255 characters or fewer')
    .optional(),
});

export const UpdateSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be 255 characters or fewer'),
});

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const SessionIdParamSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type AskQuestionInput = z.infer<typeof AskQuestionSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
