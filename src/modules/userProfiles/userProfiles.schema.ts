import { z } from 'zod';
import { type InferSelectModel } from 'drizzle-orm';
import { userProfiles } from '../../db/schema/userProfiles';

// ==========================================
// 1. Zod Validation Schemas
// ==========================================

export const CreateProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  
  // Basic Information
  firstName: z.string()
    .min(1, 'First name is required')
    .max(255, 'First name must be less than 255 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(255, 'Last name must be less than 255 characters'),
  age: z.number({ required_error: 'Age is required' })
    .int('Age must be an integer')
    .min(13, 'Age must be at least 13')
    .max(120, 'Age must be 120 or less'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required',
    invalid_type_error: 'Gender must be male, female, or other'
  }),
  dateOfBirth: z.coerce.date({
    required_error: 'Date of birth is required',
    invalid_type_error: 'Invalid date of birth'
  }),

  // Body Metrics
  heightCm: z.number({ required_error: 'Height is required' })
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height must be 300 cm or less'),
  weightKg: z.number({ required_error: 'Weight is required' })
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be 500 kg or less'),
  targetWeightKg: z.number()
    .min(20, 'Target weight must be at least 20 kg')
    .max(500, 'Target weight must be 500 kg or less')
    .nullable()
    .optional(),
  waistCm: z.number()
    .min(30, 'Waist circumference must be at least 30 cm')
    .max(200, 'Waist circumference must be 200 cm or less')
    .nullable()
    .optional(),
  bodyFatPercentage: z.number()
    .min(0, 'Body fat percentage must be at least 0%')
    .max(100, 'Body fat percentage must be 100% or less')
    .nullable()
    .optional(),

  // Demographics
  country: z.string()
    .min(1, 'Country is required')
    .max(255, 'Country must be less than 255 characters'),
  state: z.string()
    .min(1, 'State is required')
    .max(255, 'State must be less than 255 characters'),
  city: z.string()
    .min(1, 'City is required')
    .max(255, 'City must be less than 255 characters'),
  ethnicity: z.string()
    .max(255, 'Ethnicity must be less than 255 characters')
    .nullable()
    .optional(),

  // Lifestyle
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], {
    required_error: 'Activity level is required',
    invalid_type_error: 'Invalid activity level'
  }),
  occupation: z.string()
    .max(255, 'Occupation must be less than 255 characters')
    .nullable()
    .optional(),
  workoutDaysPerWeek: z.number()
    .int('Workout days per week must be an integer')
    .min(0, 'Workout days per week must be at least 0')
    .max(7, 'Workout days per week cannot exceed 7')
    .nullable()
    .optional(),
  sleepHours: z.number()
    .min(0, 'Sleep hours cannot be negative')
    .max(24, 'Sleep hours cannot exceed 24')
    .nullable()
    .optional(),

  // Goals
  goal: z.enum(['lose_weight', 'maintain', 'gain_muscle', 'gain_weight'], {
    required_error: 'Goal is required',
    invalid_type_error: 'Invalid goal selection'
  }),
  targetCalories: z.number()
    .int('Target calories must be an integer')
    .min(500, 'Target calories must be at least 500 kcal')
    .max(10000, 'Target calories cannot exceed 10,000 kcal')
    .nullable()
    .optional(),

  // Dietary Preferences
  dietType: z.enum(['vegetarian', 'vegan', 'non_vegetarian', 'eggetarian'], {
    required_error: 'Diet type is required',
    invalid_type_error: 'Invalid diet type'
  }),
  allergies: z.array(z.string()).default([]),
  dislikedFoods: z.array(z.string()).default([]),
  preferredCuisine: z.array(z.string()).default([]),

  // Health
  conditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  smoking: z.boolean().default(false),
  alcohol: z.boolean().default(false),
});

export const UpdateProfileSchema = CreateProfileSchema.partial();

// ==========================================
// 2. TypeScript Types
// ==========================================

export type UserProfile = InferSelectModel<typeof userProfiles>;
export type CreateUserProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateProfileSchema>;
