import { z } from 'zod';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';
import { dailyMeals, type MealItemBreakdown } from '../../db/schema/dailyMeals';

// ==========================================
// 1. Zod Validation Schemas
// ==========================================

export const MealTypeEnumSchema = z.enum([
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'other',
]);

export const MealItemBreakdownSchema = z.object({
  foodItem: z.string().min(1, 'Food item name is required'),
  portion: z.string().nullish().transform((v) => v || '1 serving'),
  calories: z.coerce.number().min(0, 'Calories cannot be negative').nullish().transform((v) => v ?? 0),
  protein: z.coerce.number().min(0, 'Protein cannot be negative').nullish().transform((v) => v ?? 0),
  carbs: z.coerce.number().min(0, 'Carbs cannot be negative').nullish().transform((v) => v ?? 0),
  fat: z.coerce.number().min(0, 'Fat cannot be negative').nullish().transform((v) => v ?? 0),
  fiber: z.coerce.number().min(0).nullish().transform((v) => v ?? 0),
  sugar: z.coerce.number().min(0).nullish().transform((v) => v ?? 0),
});

export const BreakdownInputSchema = z.preprocess((val) => {
  if (val === null || val === undefined || val === '' || val === 'null') return [];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return val;
}, z.array(MealItemBreakdownSchema).default([]));

export const CreateMealSchema = z.object({
  mealDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullish()
    .transform((val) => val || new Date().toISOString().split('T')[0]),
  mealTime: z.string().max(20).nullish(),
  mealType: MealTypeEnumSchema.nullish().transform((val) => val || 'other'),
  mealName: z.string().min(1, 'Meal name is required').max(255),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  calories: z.coerce.number().min(0, 'Calories cannot be negative').nullish().transform((val) => val ?? 0),
  protein: z.coerce.number().min(0).nullish().transform((val) => val ?? 0),
  carbs: z.coerce.number().min(0).nullish().transform((val) => val ?? 0),
  fat: z.coerce.number().min(0).nullish().transform((val) => val ?? 0),
  fiber: z.coerce.number().min(0).nullish().transform((val) => val ?? 0),
  sugar: z.coerce.number().min(0).nullish().transform((val) => val ?? 0),
  breakdown: BreakdownInputSchema,
  healthScore: z.coerce.number().min(1).max(10).nullish(),
  aiAnalysis: z.record(z.any()).nullish(),
});

export const UpdateMealSchema = z.object({
  mealDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  mealTime: z.string().max(20).nullish(),
  mealType: MealTypeEnumSchema.optional(),
  mealName: z.string().min(1).max(255).optional(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  calories: z.coerce.number().min(0).optional(),
  protein: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  fat: z.coerce.number().min(0).optional(),
  fiber: z.coerce.number().min(0).optional(),
  sugar: z.coerce.number().min(0).optional(),
  breakdown: BreakdownInputSchema.optional(),
  healthScore: z.coerce.number().min(1).max(10).nullish(),
  aiAnalysis: z.record(z.any()).nullish(),
});

export const UploadAndLogMealSchema = z.object({
  mealDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullish(),
  mealTime: z.string().max(20).nullish(),
  mealType: MealTypeEnumSchema.nullish(),
  mealName: z.string().max(255).nullish(),
  notes: z.string().nullish(),
  imageBase64: z.string().nullish(),
  imageUrl: z.string().nullish(),
  breakdown: BreakdownInputSchema.optional(),
});

export const AnalyzeMealImageSchema = z.object({
  imageBase64: z.string().nullish(),
  notes: z.string().nullish(),
  mealType: MealTypeEnumSchema.nullish(),
});

export const GetMealsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.enum(['day', 'week', 'none']).default('day'),
  mealType: MealTypeEnumSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const CalendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const MealIdParamSchema = z.object({
  id: z.string().uuid('Invalid meal ID format'),
});

// ==========================================
// 2. TypeScript Types
// ==========================================

export type DailyMealRecord = InferSelectModel<typeof dailyMeals>;
export type NewDailyMealRecord = InferInsertModel<typeof dailyMeals>;
export type CreateMealInput = z.infer<typeof CreateMealSchema>;
export type UpdateMealInput = z.infer<typeof UpdateMealSchema>;
export type UploadAndLogMealInput = z.infer<typeof UploadAndLogMealSchema>;
export type AnalyzeMealImageInput = z.infer<typeof AnalyzeMealImageSchema>;
export type GetMealsQuery = z.infer<typeof GetMealsQuerySchema>;
export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;
export { MealItemBreakdown };
