import { relations } from 'drizzle-orm';
import { users } from './users';
import { userProfiles } from './userProfiles';
import { userBodyMetrics } from './userBodyMetrics';
import { userDemographics } from './userDemographics';
import { userLifestyle } from './userLifestyle';
import { userDietaryPreferences } from './userDietaryPreferences';
import { userHealth } from './userHealth';

export const usersRelations = relations(users, ({ one }) => ({
  profile: one(userProfiles),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
  bodyMetrics: one(userBodyMetrics),
  demographics: one(userDemographics),
  lifestyle: one(userLifestyle),
  dietaryPreferences: one(userDietaryPreferences),
  health: one(userHealth),
}));

export const userBodyMetricsRelations = relations(userBodyMetrics, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userBodyMetrics.userProfileId],
    references: [userProfiles.id],
  }),
}));

export const userDemographicsRelations = relations(userDemographics, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userDemographics.userProfileId],
    references: [userProfiles.id],
  }),
}));

export const userLifestyleRelations = relations(userLifestyle, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userLifestyle.userProfileId],
    references: [userProfiles.id],
  }),
}));

export const userDietaryPreferencesRelations = relations(userDietaryPreferences, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userDietaryPreferences.userProfileId],
    references: [userProfiles.id],
  }),
}));

export const userHealthRelations = relations(userHealth, ({ one }) => ({
  userProfile: one(userProfiles, {
    fields: [userHealth.userProfileId],
    references: [userProfiles.id],
  }),
}));
