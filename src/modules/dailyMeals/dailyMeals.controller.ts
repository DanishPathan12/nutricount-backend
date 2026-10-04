import { Request, Response, NextFunction } from 'express';
import { DailyMealsService } from './dailyMeals.service';
import {
  CreateMealSchema,
  UpdateMealSchema,
  UploadAndLogMealSchema,
  AnalyzeMealImageSchema,
  GetMealsQuerySchema,
  CalendarQuerySchema,
  MealIdParamSchema,
} from './dailyMeals.schema';

export class DailyMealsController {
  private service: DailyMealsService;

  constructor() {
    this.service = new DailyMealsService();
  }

  /**
   * Upload image and automatically analyze + log meal in one step.
   * Supports both multipart file upload (req.file) and JSON with base64 image (req.body.imageBase64).
   */
  uploadAndLog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const parsedBody = UploadAndLogMealSchema.parse(req.body || {});
      const meal = await this.service.uploadAndLogMeal(userId, req.file, parsedBody);

      res.status(201).json({
        success: true,
        message: 'Meal logged and analyzed successfully',
        data: meal,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Analyze image with Gemini AI without creating a record yet.
   * Allows the frontend to present an editable preview to the user.
   */
  analyzeImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = AnalyzeMealImageSchema.parse(req.body || {});
      const analysis = await this.service.analyzeImageOnly(req.file, parsedBody);

      res.status(200).json({
        success: true,
        message: 'Meal image analyzed successfully',
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually create a meal log.
   */
  createMeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const parsedBody = CreateMealSchema.parse(req.body);
      const meal = await this.service.createMeal(userId, parsedBody);

      res.status(201).json({
        success: true,
        message: 'Meal logged successfully',
        data: meal,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List meals with support for timeline, grouped by day, or grouped by week.
   */
  getMeals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const query = GetMealsQuerySchema.parse(req.query);
      const result = await this.service.getMeals(userId, query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Dedicated calendar view endpoint.
   * Returns a date-indexed map for a month or date range.
   */
  getCalendarView = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const query = CalendarQuerySchema.parse(req.query);
      const result = await this.service.getCalendarView(userId, query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single meal by ID.
   */
  getMealById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = MealIdParamSchema.parse(req.params);
      const meal = await this.service.getMealById(userId, id);

      res.status(200).json({
        success: true,
        data: meal,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing meal log on the portal.
   */
  updateMeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = MealIdParamSchema.parse(req.params);
      const parsedBody = UpdateMealSchema.parse(req.body);
      const updated = await this.service.updateMeal(userId, id, parsedBody);

      res.status(200).json({
        success: true,
        message: 'Meal updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a meal log.
   */
  deleteMeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = MealIdParamSchema.parse(req.params);
      const deleted = await this.service.deleteMeal(userId, id);

      res.status(200).json({
        success: true,
        message: 'Meal deleted successfully',
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
