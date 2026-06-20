import { pgTable, uuid, doublePrecision } from 'drizzle-orm/pg-core';
import { userProfiles } from './userProfiles';

export const userBodyMetrics = pgTable('user_body_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userProfileId: uuid('user_profile_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  heightCm: doublePrecision('height_cm').notNull(),
  weightKg: doublePrecision('weight_kg').notNull(),
  targetWeightKg: doublePrecision('target_weight_kg'),
  waistCm: doublePrecision('waist_cm'),
  bodyFatPercentage: doublePrecision('body_fat_percentage'),
});
