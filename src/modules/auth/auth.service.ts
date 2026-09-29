import { AuthRepository } from './auth.repository';
import { verifyGoogleToken } from '../../utils/google';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { emailService } from '../../services/email.service';
import { AppError } from '../../utils/errors';
import type { User } from '../../db/schema/users';

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

  async sendOtp(rawEmail: string, purpose: 'signup' | 'login' | 'auth' = 'auth') {
    const email = rawEmail.trim().toLowerCase();
    const existingUser = await this.authRepository.findByEmail(email);

    if (purpose === 'signup' && existingUser) {
      throw new AppError('An account with this email already exists. Please sign in instead.', 400);
    }

    if (purpose === 'login' && !existingUser) {
      throw new AppError('No account found with this email. Please sign up first.', 404);
    }

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.authRepository.saveOtp(email, otp, purpose, expiresAt);

    await emailService.sendOtpEmail(email, otp, purpose);

    return {
      success: true,
      message: 'Verification code sent to your email.',
      isNewUser: !existingUser,
    };
  }

  async verifyOtp(rawEmail: string, otp: string, name?: string) {
    const email = rawEmail.trim().toLowerCase();
    const validOtp = await this.authRepository.findLatestValidOtp(email, otp);

    if (!validOtp) {
      throw new AppError('Invalid or expired verification code', 400);
    }

    // Clear used OTPs
    await this.authRepository.deleteOtpsByEmail(email);

    let user = await this.authRepository.findByEmail(email);
    const isNewUser = !user;

    if (!user) {
      const displayName = name?.trim() || email.split('@')[0];
      user = await this.authRepository.createUser({
        email,
        name: displayName,
        provider: 'email',
        role: 'user',
      });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    return { user, accessToken, refreshToken, isNewUser };
  }

  async refreshTokens(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await this.authRepository.findById(payload.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = createAccessToken(newPayload);
    const newRefreshToken = createRefreshToken(newPayload);

    return { user, accessToken, refreshToken: newRefreshToken };
  }

  async getCurrentUser(userId: string): Promise<User | undefined> {
    return this.authRepository.findById(userId);
  }
}
