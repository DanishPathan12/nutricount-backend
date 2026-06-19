import { AuthRepository } from './auth.repository';
import { verifyGoogleToken } from '../../utils/google';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../../utils/jwt';
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
}
