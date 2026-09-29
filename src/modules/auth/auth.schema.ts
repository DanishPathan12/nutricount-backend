import { z } from 'zod';

export const loginSchema = z.object({
  idToken: z.string().min(1, 'ID Token is required'),
});

export const sendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  purpose: z.enum(['signup', 'login', 'auth']).default('auth'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  name: z.string().min(1, 'Name is required').optional(),
});
