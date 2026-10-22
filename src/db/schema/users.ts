import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userProfiles } from './userProfiles';

import { chatSessions, chatMessages } from './chat';
import { dailyMeals } from './dailyMeals';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id').unique(),
  provider: text('provider').default('google').notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  chatSessions: many(chatSessions),
  chatMessages: many(chatMessages),
  dailyMeals: many(dailyMeals),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
