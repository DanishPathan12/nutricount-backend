import { pgTable, uuid, pgEnum, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userProfiles } from './userProfiles';

export const dietTypeEnum = pgEnum('diet_type_enum', [
  'vegetarian',
  'vegan',
  'non_vegetarian',
  'eggetarian'
]);

export const userDietaryPreferences = pgTable('user_dietary_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  dietType: dietTypeEnum('diet_type').notNull(),
  allergies: text('allergies').array().notNull().default(sql`ARRAY[]::text[]`),
  dislikedFoods: text('disliked_foods').array().notNull().default(sql`ARRAY[]::text[]`),
  preferredCuisine: text('preferred_cuisine').array().notNull().default(sql`ARRAY[]::text[]`),
});
