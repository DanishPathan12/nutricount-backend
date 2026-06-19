import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleUser> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google token payload');
    }

    if (!payload.email || !payload.name || !payload.sub) {
      throw new Error('Google token missing required fields');
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture || '',
      sub: payload.sub,
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Authentication failed');
  }
};
