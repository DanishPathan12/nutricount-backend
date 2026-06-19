import { z } from 'zod';

export const loginSchema = z.object({
  idToken: z.string().min(1, 'ID Token is required'),
});
