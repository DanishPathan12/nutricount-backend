import { UserProfilesRepository } from './userProfiles.repository';
import type { CreateUserProfileInput, UpdateUserProfileInput } from './userProfiles.schema';
import { AppError } from '../../utils/errors';

export class UserProfilesService {
  private repository: UserProfilesRepository;

  constructor() {
    this.repository = new UserProfilesRepository();
  }

  async getProfileByUserId(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new AppError('Profile not found', 404);
    }
    return profile;
  }

  async createProfile(data: CreateUserProfileInput) {
    const existing = await this.repository.findByUserId(data.userId);
    if (existing) {
      throw new AppError('Profile already exists for this user', 400);
    }
    return this.repository.create(data);
  }

  async updateProfile(userId: string, data: UpdateUserProfileInput) {
    const existing = await this.repository.findByUserId(userId);
    if (!existing) {
      throw new AppError('Profile not found', 404);
    }
    return this.repository.update(userId, data);
  }

  async deleteProfile(userId: string) {
    const existing = await this.repository.findByUserId(userId);
    if (!existing) {
      throw new AppError('Profile not found', 404);
    }
    return this.repository.delete(userId);
  }

  async listProfiles(limit: number = 10, offset: number = 0) {
    return this.repository.list(limit, offset);
  }
}
