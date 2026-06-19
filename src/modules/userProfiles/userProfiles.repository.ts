import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { userProfiles } from '../../db/schema/userProfiles';
import type { CreateUserProfileInput, UpdateUserProfileInput } from './userProfiles.schema';

export class UserProfilesRepository {
  async findByUserId(userId: string) {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async findById(id: string) {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.id, id)).limit(1);
    return result[0];
  }

  async create(data: CreateUserProfileInput) {
    const result = await db.insert(userProfiles).values(data).returning();
    return result[0];
  }

  async update(userId: string, data: UpdateUserProfileInput) {
    const result = await db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async delete(userId: string) {
    const result = await db.delete(userProfiles).where(eq(userProfiles.userId, userId)).returning();
    return result[0];
  }

  async list(limit: number = 10, offset: number = 0) {
    return db.select().from(userProfiles).limit(limit).offset(offset);
  }
}
