import { z } from 'zod';

export const AskQuestionSchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

export type AskQuestionInput = z.infer<typeof AskQuestionSchema>;
