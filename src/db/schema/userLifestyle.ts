import { pgTable, uuid, pgEnum, varchar, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { userProfiles } from './userProfiles';

export const activityLevelEnum = pgEnum('activity_level_enum', [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active'
]);

export const userLifestyle = pgTable('user_lifestyle', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  activityLevel: activityLevelEnum('activity_level').notNull(),
  occupation: varchar('occupation', { length: 255 }),
  workoutDaysPerWeek: integer('workout_days_per_week'),
  sleepHours: doublePrecision('sleep_hours'),
});
