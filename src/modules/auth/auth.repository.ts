import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from '../../db';
import { users, otps, type User, type NewUser, type Otp, type NewOtp } from '../../db/schema';

export class AuthRepository {
  async findByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async findById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async createUser(user: NewUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async createOtp(otpRecord: NewOtp): Promise<Otp> {
    const result = await db.insert(otps).values(otpRecord).returning();
    return result[0];
  }

  async findLatestActiveOtp(email: string): Promise<Otp | undefined> {
    const result = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.email, email),
          eq(otps.used, false),
          gt(otps.expiresAt, new Date())
        )
      )
      .orderBy(desc(otps.createdAt))
      .limit(1);
    return result[0];
  }

  async markOtpAsUsed(id: string): Promise<void> {
    await db.update(otps).set({ used: true }).where(eq(otps.id, id));
  }
}
