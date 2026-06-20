import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { userProfiles } from './userProfiles';

export const userDemographics = pgTable('user_demographics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  country: varchar('country', { length: 255 }).notNull(),
  state: varchar('state', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  ethnicity: varchar('ethnicity', { length: 255 }),
});
