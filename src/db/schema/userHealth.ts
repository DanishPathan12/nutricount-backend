import { pgTable, uuid, text, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userProfiles } from './userProfiles';

export const userHealth = pgTable('user_health', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  conditions: text('conditions').array().notNull().default(sql`ARRAY[]::text[]`),
  medications: text('medications').array().notNull().default(sql`ARRAY[]::text[]`),
  smoking: boolean('smoking').notNull().default(false),
  alcohol: boolean('alcohol').notNull().default(false),
});
