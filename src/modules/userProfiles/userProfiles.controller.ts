import { Request, Response, NextFunction } from 'express';
import { UserProfilesService } from './userProfiles.service';
import { CreateProfileSchema, UpdateProfileSchema } from './userProfiles.schema';

export class UserProfilesController {
  private service: UserProfilesService;

  constructor() {
    this.service = new UserProfilesService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Enforce the authenticated user's ID
      const data = CreateProfileSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });

      const profile = await this.service.createProfile(data);
      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.service.getProfileByUserId(req.user!.userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  getByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only admins can list profiles',
        });
      }

      const profile = await this.service.getProfileByUserId(userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = UpdateProfileSchema.parse(req.body);
      const profile = await this.service.updateProfile(req.user!.userId, data);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  updateByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const data = UpdateProfileSchema.parse(req.body);
      const profile = await this.service.updateProfile(userId, data);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteProfile(req.user!.userId);
      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      await this.service.deleteProfile(userId);
      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Only admins can list profiles',
        });
      }

      let limit = parseInt(req.query.limit as string);
      let offset = parseInt(req.query.offset as string);

      if (isNaN(limit) || limit < 1) limit = 10;
      if (isNaN(offset) || offset < 0) offset = 0;

      const profiles = await this.service.listProfiles(limit, offset);
      res.status(200).json({
        success: true,
        data: profiles,
      });
    } catch (error) {
      next(error);
    }
  };
}
