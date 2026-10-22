import { and, eq, gt } from 'drizzle-orm';
import { db } from '../../db';
import { users, type User, type NewUser } from '../../db/schema/users';
import { otps, type Otp } from '../../db/schema/otps';

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

  async saveOtp(email: string, otp: string, purpose: string, expiresAt: Date): Promise<Otp> {
    // Invalidate prior OTPs for this email
    await db.delete(otps).where(eq(otps.email, email));

    const result = await db
      .insert(otps)
      .values({
        email,
        otp,
        purpose,
        expiresAt,
      })
      .returning();

    return result[0];
  }

  async findLatestValidOtp(email: string, otp: string): Promise<Otp | undefined> {
    const result = await db
      .select()
      .from(otps)
      .where(and(eq(otps.email, email), eq(otps.otp, otp), gt(otps.expiresAt, new Date())))
      .limit(1);

    return result[0];
  }

  async deleteOtpsByEmail(email: string): Promise<void> {
    await db.delete(otps).where(eq(otps.email, email));
  }
}
