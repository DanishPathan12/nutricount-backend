import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const otps = pgTable('otps', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  used: boolean('used').default(false).notNull(),
});

export type Otp = typeof otps.$inferSelect;
export type NewOtp = typeof otps.$inferInsert;
