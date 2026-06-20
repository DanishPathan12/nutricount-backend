import { eq } from 'drizzle-orm';
import { db } from '../../db';
import {
  userProfiles,
  userBodyMetrics,
  userDemographics,
  userLifestyle,
  userDietaryPreferences,
  userHealth,
} from '../../db/schema';
import type { CreateUserProfileInput, UpdateUserProfileInput } from './userProfiles.schema';

function mapToFlatProfile(profile: any): any {
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    age: profile.age,
    gender: profile.gender,
    dateOfBirth: profile.dateOfBirth,
    goal: profile.goal,
    targetCalories: profile.targetCalories,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,

    // Body Metrics
    heightCm: profile.bodyMetrics?.heightCm,
    weightKg: profile.bodyMetrics?.weightKg,
    targetWeightKg: profile.bodyMetrics?.targetWeightKg,
    waistCm: profile.bodyMetrics?.waistCm,
    bodyFatPercentage: profile.bodyMetrics?.bodyFatPercentage,

    // Demographics
    country: profile.demographics?.country,
    state: profile.demographics?.state,
    city: profile.demographics?.city,
    ethnicity: profile.demographics?.ethnicity,

    // Lifestyle
    activityLevel: profile.lifestyle?.activityLevel,
    occupation: profile.lifestyle?.occupation,
    workoutDaysPerWeek: profile.lifestyle?.workoutDaysPerWeek,
    sleepHours: profile.lifestyle?.sleepHours,

    // Dietary Preferences
    dietType: profile.dietaryPreferences?.dietType,
    allergies: profile.dietaryPreferences?.allergies || [],
    dislikedFoods: profile.dietaryPreferences?.dislikedFoods || [],
    preferredCuisine: profile.dietaryPreferences?.preferredCuisine || [],

    // Health
    conditions: profile.health?.conditions || [],
    medications: profile.health?.medications || [],
    smoking: profile.health?.smoking || false,
    alcohol: profile.health?.alcohol || false,
  };
}

export class UserProfilesRepository {
  async findByUserId(userId: string) {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
      with: {
        bodyMetrics: true,
        demographics: true,
        lifestyle: true,
        dietaryPreferences: true,
        health: true,
      },
    });
    return mapToFlatProfile(profile);
  }

  async findById(id: string) {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, id),
      with: {
        bodyMetrics: true,
        demographics: true,
        lifestyle: true,
        dietaryPreferences: true,
        health: true,
      },
    });
    return mapToFlatProfile(profile);
  }

  async create(data: CreateUserProfileInput) {
    const result = await db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(userProfiles)
        .values({
          userId: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          goal: data.goal,
          targetCalories: data.targetCalories,
        })
        .returning();

      const profileId = profile.id;

      const [bodyMetrics] = await tx
        .insert(userBodyMetrics)
        .values({
          userProfileId: profileId,
          heightCm: data.heightCm,
          weightKg: data.weightKg,
          targetWeightKg: data.targetWeightKg,
          waistCm: data.waistCm,
          bodyFatPercentage: data.bodyFatPercentage,
        })
        .returning();

      const [demographics] = await tx
        .insert(userDemographics)
        .values({
          userProfileId: profileId,
          country: data.country,
          state: data.state,
          city: data.city,
          ethnicity: data.ethnicity,
        })
        .returning();

      const [lifestyle] = await tx
        .insert(userLifestyle)
        .values({
          userProfileId: profileId,
          activityLevel: data.activityLevel,
          occupation: data.occupation,
          workoutDaysPerWeek: data.workoutDaysPerWeek,
          sleepHours: data.sleepHours,
        })
        .returning();

      const [dietaryPreferences] = await tx
        .insert(userDietaryPreferences)
        .values({
          userProfileId: profileId,
          dietType: data.dietType,
          allergies: data.allergies,
          dislikedFoods: data.dislikedFoods,
          preferredCuisine: data.preferredCuisine,
        })
        .returning();

      const [health] = await tx
        .insert(userHealth)
        .values({
          userProfileId: profileId,
          conditions: data.conditions,
          medications: data.medications,
          smoking: data.smoking,
          alcohol: data.alcohol,
        })
        .returning();

      return {
        ...profile,
        bodyMetrics,
        demographics,
        lifestyle,
        dietaryPreferences,
        health,
      };
    });

    return mapToFlatProfile(result);
  }

  async update(userId: string, data: UpdateUserProfileInput) {
    const existing = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!existing[0]) return null;
    const profileId = existing[0].id;

    const result = await db.transaction(async (tx) => {
      // 1. Update userProfiles
      const profileFields: any = {};
      if (data.firstName !== undefined) profileFields.firstName = data.firstName;
      if (data.lastName !== undefined) profileFields.lastName = data.lastName;
      if (data.age !== undefined) profileFields.age = data.age;
      if (data.gender !== undefined) profileFields.gender = data.gender;
      if (data.dateOfBirth !== undefined) profileFields.dateOfBirth = data.dateOfBirth;
      if (data.goal !== undefined) profileFields.goal = data.goal;
      if (data.targetCalories !== undefined) profileFields.targetCalories = data.targetCalories;
      profileFields.updatedAt = new Date();

      const [updatedProfile] = await tx
        .update(userProfiles)
        .set(profileFields)
        .where(eq(userProfiles.id, profileId))
        .returning();

      // 2. Update userBodyMetrics
      const bodyMetricsFields: any = {};
      if (data.heightCm !== undefined) bodyMetricsFields.heightCm = data.heightCm;
      if (data.weightKg !== undefined) bodyMetricsFields.weightKg = data.weightKg;
      if (data.targetWeightKg !== undefined) bodyMetricsFields.targetWeightKg = data.targetWeightKg;
      if (data.waistCm !== undefined) bodyMetricsFields.waistCm = data.waistCm;
      if (data.bodyFatPercentage !== undefined) bodyMetricsFields.bodyFatPercentage = data.bodyFatPercentage;

      let updatedBodyMetrics = null;
      if (Object.keys(bodyMetricsFields).length > 0) {
        const [res] = await tx
          .update(userBodyMetrics)
          .set(bodyMetricsFields)
          .where(eq(userBodyMetrics.userProfileId, profileId))
          .returning();
        updatedBodyMetrics = res;
      } else {
        const [res] = await tx
          .select()
          .from(userBodyMetrics)
          .where(eq(userBodyMetrics.userProfileId, profileId))
          .limit(1);
        updatedBodyMetrics = res;
      }

      // 3. Update userDemographics
      const demographicsFields: any = {};
      if (data.country !== undefined) demographicsFields.country = data.country;
      if (data.state !== undefined) demographicsFields.state = data.state;
      if (data.city !== undefined) demographicsFields.city = data.city;
      if (data.ethnicity !== undefined) demographicsFields.ethnicity = data.ethnicity;

      let updatedDemographics = null;
      if (Object.keys(demographicsFields).length > 0) {
        const [res] = await tx
          .update(userDemographics)
          .set(demographicsFields)
          .where(eq(userDemographics.userProfileId, profileId))
          .returning();
        updatedDemographics = res;
      } else {
        const [res] = await tx
          .select()
          .from(userDemographics)
          .where(eq(userDemographics.userProfileId, profileId))
          .limit(1);
        updatedDemographics = res;
      }

      // 4. Update userLifestyle
      const lifestyleFields: any = {};
      if (data.activityLevel !== undefined) lifestyleFields.activityLevel = data.activityLevel;
      if (data.occupation !== undefined) lifestyleFields.occupation = data.occupation;
      if (data.workoutDaysPerWeek !== undefined) lifestyleFields.workoutDaysPerWeek = data.workoutDaysPerWeek;
      if (data.sleepHours !== undefined) lifestyleFields.sleepHours = data.sleepHours;

      let updatedLifestyle = null;
      if (Object.keys(lifestyleFields).length > 0) {
        const [res] = await tx
          .update(userLifestyle)
          .set(lifestyleFields)
          .where(eq(userLifestyle.userProfileId, profileId))
          .returning();
        updatedLifestyle = res;
      } else {
        const [res] = await tx
          .select()
          .from(userLifestyle)
          .where(eq(userLifestyle.userProfileId, profileId))
          .limit(1);
        updatedLifestyle = res;
      }

      // 5. Update userDietaryPreferences
      const dietaryPreferencesFields: any = {};
      if (data.dietType !== undefined) dietaryPreferencesFields.dietType = data.dietType;
      if (data.allergies !== undefined) dietaryPreferencesFields.allergies = data.allergies;
      if (data.dislikedFoods !== undefined) dietaryPreferencesFields.dislikedFoods = data.dislikedFoods;
      if (data.preferredCuisine !== undefined) dietaryPreferencesFields.preferredCuisine = data.preferredCuisine;

      let updatedDietaryPreferences = null;
      if (Object.keys(dietaryPreferencesFields).length > 0) {
        const [res] = await tx
          .update(userDietaryPreferences)
          .set(dietaryPreferencesFields)
          .where(eq(userDietaryPreferences.userProfileId, profileId))
          .returning();
        updatedDietaryPreferences = res;
      } else {
        const [res] = await tx
          .select()
          .from(userDietaryPreferences)
          .where(eq(userDietaryPreferences.userProfileId, profileId))
          .limit(1);
        updatedDietaryPreferences = res;
      }

      // 6. Update userHealth
      const healthFields: any = {};
      if (data.conditions !== undefined) healthFields.conditions = data.conditions;
      if (data.medications !== undefined) healthFields.medications = data.medications;
      if (data.smoking !== undefined) healthFields.smoking = data.smoking;
      if (data.alcohol !== undefined) healthFields.alcohol = data.alcohol;

      let updatedHealth = null;
      if (Object.keys(healthFields).length > 0) {
        const [res] = await tx
          .update(userHealth)
          .set(healthFields)
          .where(eq(userHealth.userProfileId, profileId))
          .returning();
        updatedHealth = res;
      } else {
        const [res] = await tx
          .select()
          .from(userHealth)
          .where(eq(userHealth.userProfileId, profileId))
          .limit(1);
        updatedHealth = res;
      }

      return {
        ...updatedProfile,
        bodyMetrics: updatedBodyMetrics,
        demographics: updatedDemographics,
        lifestyle: updatedLifestyle,
        dietaryPreferences: updatedDietaryPreferences,
        health: updatedHealth,
      };
    });

    return mapToFlatProfile(result);
  }

  async delete(userId: string) {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async list(limit: number = 10, offset: number = 0) {
    const profiles = await db.query.userProfiles.findMany({
      limit,
      offset,
      with: {
        bodyMetrics: true,
        demographics: true,
        lifestyle: true,
        dietaryPreferences: true,
        health: true,
      },
    });
    return profiles.map(mapToFlatProfile).filter(Boolean);
  }
}
