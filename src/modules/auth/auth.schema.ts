import { z } from 'zod';

export const loginSchema = z.object({
  idToken: z.string().min(1, 'ID Token is required'),
});

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});
