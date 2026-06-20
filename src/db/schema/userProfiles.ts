import { pgTable, uuid, integer, varchar, date, pgEnum, uniqueIndex, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// 1. PostgreSQL Enums
export const genderEnum = pgEnum('gender_enum', ['male', 'female', 'other']);

export const goalEnum = pgEnum('goal_enum', [
  'lose_weight',
  'maintain',
  'gain_muscle',
  'gain_weight'
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
  goal: goalEnum('goal').notNull(),
  targetCalories: integer('target_calories'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: uniqueIndex('user_id_idx').on(table.userId),
  };
});
