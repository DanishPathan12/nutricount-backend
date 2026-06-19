import { pgTable, uuid, integer, text, timestamp, boolean, varchar, doublePrecision, date, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

// 1. PostgreSQL Enums
export const genderEnum = pgEnum('gender_enum', ['male', 'female', 'other']);

export const activityLevelEnum = pgEnum('activity_level_enum', [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active'
]);

export const goalEnum = pgEnum('goal_enum', [
  'lose_weight',
  'maintain',
  'gain_muscle',
  'gain_weight'
]);

export const dietTypeEnum = pgEnum('diet_type_enum', [
  'vegetarian',
  'vegan',
  'non_vegetarian',
  'eggetarian'
]);

// 2. Table Definition
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  
  // Basic Information
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  age: integer('age').notNull(),
  gender: genderEnum('gender').notNull(),
  dateOfBirth: date('date_of_birth', { mode: 'date' }).notNull(),

  // Body Metrics
  heightCm: doublePrecision('height_cm').notNull(),
  weightKg: doublePrecision('weight_kg').notNull(),
  targetWeightKg: doublePrecision('target_weight_kg'),
  waistCm: doublePrecision('waist_cm'),
  bodyFatPercentage: doublePrecision('body_fat_percentage'),

  // Demographics
  country: varchar('country', { length: 255 }).notNull(),
  state: varchar('state', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  ethnicity: varchar('ethnicity', { length: 255 }),

  // Lifestyle
  activityLevel: activityLevelEnum('activity_level').notNull(),
  occupation: varchar('occupation', { length: 255 }),
  workoutDaysPerWeek: integer('workout_days_per_week'),
  sleepHours: doublePrecision('sleep_hours'),

  // Goals
  goal: goalEnum('goal').notNull(),
  targetCalories: integer('target_calories'),

  // Dietary Preferences
  dietType: dietTypeEnum('diet_type').notNull(),
  allergies: text('allergies').array().notNull().default(sql`ARRAY[]::text[]`),
  dislikedFoods: text('disliked_foods').array().notNull().default(sql`ARRAY[]::text[]`),
  preferredCuisine: text('preferred_cuisine').array().notNull().default(sql`ARRAY[]::text[]`),

  // Health
  conditions: text('conditions').array().notNull().default(sql`ARRAY[]::text[]`),
  medications: text('medications').array().notNull().default(sql`ARRAY[]::text[]`),
  smoking: boolean('smoking').notNull().default(false),
  alcohol: boolean('alcohol').notNull().default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: uniqueIndex('user_id_idx').on(table.userId),
  };
});

// 3. Relations Definition
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));
