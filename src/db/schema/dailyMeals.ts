import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  integer,
  date,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// 1. Meal Type Enum
export const mealTypeEnum = pgEnum('meal_type_enum', [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'other',
]);

// 2. Nutrition Breakdown Interface for Individual Food Items
export interface MealItemBreakdown {
  foodItem: string;
  portion: string;
  calories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  fiber?: number;   // in grams
  sugar?: number;   // in grams
}

// 3. Daily Meals Table Definition
export const dailyMeals = pgTable(
  'daily_meals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    mealDate: date('meal_date', { mode: 'string' }).notNull(), // 'YYYY-MM-DD'
    mealTime: varchar('meal_time', { length: 20 }), // e.g. '08:30 AM'
    mealType: mealTypeEnum('meal_type').notNull(),
    mealName: varchar('meal_name', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    calories: doublePrecision('calories').default(0).notNull(),
    protein: doublePrecision('protein').default(0).notNull(),
    carbs: doublePrecision('carbs').default(0).notNull(),
    fat: doublePrecision('fat').default(0).notNull(),
    fiber: doublePrecision('fiber').default(0),
    sugar: doublePrecision('sugar').default(0),
    breakdown: jsonb('breakdown').$type<MealItemBreakdown[]>().default([]).notNull(),
    healthScore: integer('health_score'), // 1 to 10
    aiAnalysis: jsonb('ai_analysis').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('daily_meals_user_id_idx').on(table.userId),
    mealDateIdx: index('daily_meals_meal_date_idx').on(table.mealDate),
    userMealDateIdx: index('daily_meals_user_meal_date_idx').on(table.userId, table.mealDate),
    createdAtIdx: index('daily_meals_created_at_idx').on(table.createdAt),
  })
);

// 4. Relations
export const dailyMealsRelations = relations(dailyMeals, ({ one }) => ({
  user: one(users, {
    fields: [dailyMeals.userId],
    references: [users.id],
  }),
}));

export type DailyMeal = typeof dailyMeals.$inferSelect;
export type NewDailyMeal = typeof dailyMeals.$inferInsert;
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
