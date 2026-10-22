import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const otps = pgTable('otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  purpose: text('purpose').default('auth').notNull(), // 'signup' | 'login' | 'auth'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Otp = typeof otps.$inferSelect;
export type NewOtp = typeof otps.$inferInsert;
