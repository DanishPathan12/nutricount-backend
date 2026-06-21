import { AuthRepository } from './auth.repository';
import { verifyGoogleToken } from '../../utils/google';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import type { User } from '../../db/schema/users';
import { sendOtpEmail } from '../../utils/mailer';
import { AppError } from '../../utils/errors';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async googleLogin(idToken: string) {
    const googleUser = await verifyGoogleToken(idToken);

    let user = await this.authRepository.findByEmail(googleUser.email);

    if (!user) {
      user = await this.authRepository.createUser({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        googleId: googleUser.sub,
        provider: 'google',
      });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    return { user, accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await this.authRepository.findById(payload.userId);

    if (!user) {
      throw new Error('User not found');
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = createAccessToken(newPayload);
    const newRefreshToken = createRefreshToken(newPayload);

    return { user, accessToken, refreshToken: newRefreshToken };
  }

  async getCurrentUser(userId: string): Promise<User | undefined> {
    return this.authRepository.findById(userId);
  }

  async sendOtp(email: string): Promise<void> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    await this.authRepository.createOtp({
      email,
      code,
      expiresAt,
    });

    await sendOtpEmail(email, code);
  }

  async verifyOtp(email: string, code: string) {
    const otpRecord = await this.authRepository.findLatestActiveOtp(email);

    if (!otpRecord || otpRecord.code !== code) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    // Mark OTP as used
    await this.authRepository.markOtpAsUsed(otpRecord.id);

    // Find or create user
    let user = await this.authRepository.findByEmail(email);

    if (!user) {
      // Create user
      const name = email.split('@')[0];
      user = await this.authRepository.createUser({
        email,
        name,
        provider: 'email',
      });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    return { user, accessToken, refreshToken };
  }
}
