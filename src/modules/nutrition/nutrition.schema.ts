import { z } from 'zod';

export const AnalyzeImageSchema = z.object({
  imageKey: z.string().min(1, 'Image key is required'),
  imageUrl: z.string().url('Invalid image URL format'),
});

export type AnalyzeImageInput = z.infer<typeof AnalyzeImageSchema>;
