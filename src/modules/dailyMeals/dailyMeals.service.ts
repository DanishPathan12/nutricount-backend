import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DailyMealsRepository } from './dailyMeals.repository';
import {
  CreateMealInput,
  UpdateMealInput,
  UploadAndLogMealInput,
  AnalyzeMealImageInput,
  GetMealsQuery,
  CalendarQuery,
  MealItemBreakdown,
} from './dailyMeals.schema';
import { AiService, MealNutritionAnalysis } from '../../services/ai.service';
import { AppError } from '../../utils/errors';
import { DailyMeal, MealType } from '../../db/schema/dailyMeals';

export class DailyMealsService {
  private repository: DailyMealsRepository;

  constructor() {
    this.repository = new DailyMealsRepository();
  }

  /**
   * Helper: Save buffer to /uploads/meals directory and return relative URL.
   */
  private saveBufferToUploads(buffer: Buffer, originalExt: string = '.jpg'): string {
    const uploadDir = path.join(process.cwd(), 'uploads', 'meals');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeExt = originalExt.startsWith('.') ? originalExt : `.${originalExt}`;
    const filename = `${Date.now()}-${crypto.randomUUID()}${safeExt}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/meals/${filename}`;
  }

  /**
   * Helper: Save base64 string to /uploads/meals.
   */
  private saveBase64ToUploads(base64Data: string): { imageUrl: string; buffer: Buffer; mimeType: string } {
    let mimeType = 'image/jpeg';
    let ext = '.jpg';
    const match = base64Data.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    if (match) {
      mimeType = match[1];
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('gif')) ext = '.gif';
    }
    const pureBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const buffer = Buffer.from(pureBase64, 'base64');
    const imageUrl = this.saveBufferToUploads(buffer, ext);
    return { imageUrl, buffer, mimeType };
  }

  /**
   * Helper: Determine day of week name from YYYY-MM-DD.
   */
  private getDayOfWeek(dateStr: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr + 'T00:00:00Z');
    return days[d.getUTCDay()];
  }

  /**
   * Helper: Determine week boundaries (Monday to Sunday) from YYYY-MM-DD.
   */
  private getWeekRange(dateStr: string): { weekStart: string; weekEnd: string; weekKey: string; weekNumber: number; year: number } {
    const d = new Date(dateStr + 'T00:00:00Z');
    const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

    // Calculate ISO Week Number
    const target = new Date(d.valueOf());
    const dayNr = (d.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const year = new Date(firstThursday).getUTCFullYear();

    return {
      weekStart,
      weekEnd,
      weekKey: `${year}-W${String(weekNumber).padStart(2, '0')}`,
      weekNumber,
      year,
    };
  }

  /**
   * 1. Analyze an image without saving to DB (for interactive UI preview / edit before saving).
   */
  async analyzeImageOnly(
    file?: Express.Multer.File,
    input?: AnalyzeMealImageInput
  ): Promise<MealNutritionAnalysis> {
    let imageBuffer: Buffer | undefined;
    let mimeType = 'image/jpeg';
    let imageBase64: string | undefined;

    if (file) {
      imageBuffer = file.buffer;
      mimeType = file.mimetype;
    } else if (input?.imageBase64) {
      imageBase64 = input.imageBase64;
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      if (match) mimeType = match[1];
    } else {
      throw new AppError('Either an image file or imageBase64 string must be provided for analysis', 400);
    }

    throw new AppError(
      'Direct HTTP calls to AI services are disabled. Meal image analysis will be processed asynchronously via RabbitMQ.',
      501
    );
  }

  /**
   * 2. Upload image and log meal in one step (AI analysis queued asynchronously).
   */
  async uploadAndLogMeal(
    userId: string,
    file?: Express.Multer.File,
    input?: UploadAndLogMealInput
  ): Promise<DailyMeal> {
    let imageBuffer: Buffer | undefined;
    let mimeType = 'image/jpeg';
    let imageBase64: string | undefined;
    let storedImageUrl: string | undefined = input?.imageUrl || undefined;

    if (file) {
      imageBuffer = file.buffer;
      mimeType = file.mimetype;
      const ext = path.extname(file.originalname) || '.jpg';
      storedImageUrl = this.saveBufferToUploads(imageBuffer, ext);
    } else if (input?.imageBase64) {
      imageBase64 = input.imageBase64;
      const saved = this.saveBase64ToUploads(imageBase64);
      storedImageUrl = saved.imageUrl;
      imageBuffer = saved.buffer;
      mimeType = saved.mimeType;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const mealDate = input?.mealDate || todayStr;
    const mealTime = input?.mealTime || currentTimeStr;
    const mealType = (input?.mealType || 'other') as MealType;
    const mealName = input?.mealName || (input?.notes ? input.notes.slice(0, 50) : 'Logged Meal');
    const calories = 0;
    const protein = 0;
    const carbs = 0;
    const fat = 0;
    const fiber = 0;
    const sugar = 0;
    const breakdown: MealItemBreakdown[] = [];
    const healthScore = null;

    const created = await this.repository.create({
      userId,
      mealDate,
      mealTime,
      mealType,
      mealName,
      description: input?.notes || null,
      imageUrl: storedImageUrl || null,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      breakdown,
      healthScore,
      aiAnalysis: { status: 'pending_async_processing' },
    });

    // Queue asynchronous meal analysis task (ready for RabbitMQ consumer)
    await AiService.queueMealAnalysisTask({
      mealId: created.id,
      userId,
      imageUrl: storedImageUrl || null,
      notes: input?.notes || null,
      mealType,
    });

    return created;
  }

  /**
   * 3. Create a meal log directly (e.g. manual entry or after user adjusts analysis).
   */
  async createMeal(userId: string, input: CreateMealInput): Promise<DailyMeal> {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let imageUrl = input.imageUrl;
    // If base64 was passed in imageUrl or description
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      const saved = this.saveBase64ToUploads(imageUrl);
      imageUrl = saved.imageUrl;
    }

    return this.repository.create({
      userId,
      mealDate: input.mealDate || todayStr,
      mealTime: input.mealTime || currentTimeStr,
      mealType: input.mealType,
      mealName: input.mealName,
      description: input.description || null,
      imageUrl: imageUrl || null,
      calories: input.calories || 0,
      protein: input.protein || 0,
      carbs: input.carbs || 0,
      fat: input.fat || 0,
      fiber: input.fiber || 0,
      sugar: input.sugar || 0,
      breakdown: input.breakdown || [],
      healthScore: input.healthScore || null,
      aiAnalysis: input.aiAnalysis || null,
    });
  }

  /**
   * 4. Update an existing meal log on the portal.
   */
  async updateMeal(userId: string, mealId: string, input: UpdateMealInput): Promise<DailyMeal> {
    const existing = await this.repository.findById(mealId, userId);
    if (!existing) {
      throw new AppError('Meal not found', 404);
    }

    let imageUrl = input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl;
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      const saved = this.saveBase64ToUploads(imageUrl);
      imageUrl = saved.imageUrl;
    }

    const updated = await this.repository.update(mealId, userId, {
      ...input,
      imageUrl,
    });

    if (!updated) {
      throw new AppError('Failed to update meal', 500);
    }

    return updated;
  }

  /**
   * 5. Get a specific meal by ID.
   */
  async getMealById(userId: string, mealId: string): Promise<DailyMeal> {
    const meal = await this.repository.findById(mealId, userId);
    if (!meal) {
      throw new AppError('Meal not found', 404);
    }
    return meal;
  }

  /**
   * 6. Delete a meal log.
   */
  async deleteMeal(userId: string, mealId: string): Promise<DailyMeal> {
    const existing = await this.repository.findById(mealId, userId);
    if (!existing) {
      throw new AppError('Meal not found', 404);
    }
    const deleted = await this.repository.delete(mealId, userId);
    if (!deleted) {
      throw new AppError('Failed to delete meal', 500);
    }
    return deleted;
  }

  /**
   * 7. List meals grouped by day, week, or flat timeline view.
   */
  async getMeals(userId: string, query: GetMealsQuery) {
    const { groupBy, startDate, endDate, mealType, page, limit } = query;
    const offset = (page - 1) * limit;

    // Flat pagination query
    if (groupBy === 'none') {
      const meals = await this.repository.list({
        userId,
        startDate,
        endDate,
        mealType,
        limit,
        offset,
      });

      const total = await this.repository.count({
        userId,
        startDate,
        endDate,
        mealType,
      });

      // Calculate total calories & macros for returned slice
      const summary = meals.reduce(
        (acc, m) => {
          acc.totalCalories += m.calories;
          acc.totalProtein += m.protein;
          acc.totalCarbs += m.carbs;
          acc.totalFat += m.fat;
          return acc;
        },
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
      );

      return {
        groupBy: 'none',
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
        summary: {
          mealsCount: meals.length,
          totalCalories: Math.round(summary.totalCalories),
          totalProtein: Math.round(summary.totalProtein * 10) / 10,
          totalCarbs: Math.round(summary.totalCarbs * 10) / 10,
          totalFat: Math.round(summary.totalFat * 10) / 10,
        },
        data: meals,
      };
    }

    // For Group by Day or Group by Week:
    // Fetch meals in range (or latest meals if no date range specified)
    const meals = await this.repository.list({
      userId,
      startDate,
      endDate,
      mealType,
      limit: 500, // Fetch batch for grouping
      offset: 0,
    });

    if (groupBy === 'day') {
      const dayMap: {
        [date: string]: {
          date: string;
          dayOfWeek: string;
          totalCalories: number;
          totalProtein: number;
          totalCarbs: number;
          totalFat: number;
          totalFiber: number;
          totalSugar: number;
          mealsCount: number;
          meals: DailyMeal[];
        };
      } = {};

      for (const meal of meals) {
        if (!dayMap[meal.mealDate]) {
          dayMap[meal.mealDate] = {
            date: meal.mealDate,
            dayOfWeek: this.getDayOfWeek(meal.mealDate),
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalFiber: 0,
            totalSugar: 0,
            mealsCount: 0,
            meals: [],
          };
        }

        const dayEntry = dayMap[meal.mealDate];
        dayEntry.totalCalories += meal.calories;
        dayEntry.totalProtein += meal.protein;
        dayEntry.totalCarbs += meal.carbs;
        dayEntry.totalFat += meal.fat;
        dayEntry.totalFiber += meal.fiber || 0;
        dayEntry.totalSugar += meal.sugar || 0;
        dayEntry.mealsCount += 1;
        dayEntry.meals.push(meal);
      }

      // Format array sorted by date descending (timeline/calendar style)
      const dayList = Object.values(dayMap)
        .map((day) => ({
          ...day,
          totalCalories: Math.round(day.totalCalories),
          totalProtein: Math.round(day.totalProtein * 10) / 10,
          totalCarbs: Math.round(day.totalCarbs * 10) / 10,
          totalFat: Math.round(day.totalFat * 10) / 10,
          totalFiber: Math.round(day.totalFiber * 10) / 10,
          totalSugar: Math.round(day.totalSugar * 10) / 10,
        }))
        .sort((a, b) => b.date.localeCompare(a.date));

      const overallCalories = dayList.reduce((sum, d) => sum + d.totalCalories, 0);
      const overallProtein = dayList.reduce((sum, d) => sum + d.totalProtein, 0);
      const overallCarbs = dayList.reduce((sum, d) => sum + d.totalCarbs, 0);
      const overallFat = dayList.reduce((sum, d) => sum + d.totalFat, 0);
      const daysCount = dayList.length;

      return {
        groupBy: 'day',
        summary: {
          totalMeals: meals.length,
          daysLogged: daysCount,
          totalCalories: Math.round(overallCalories),
          avgDailyCalories: daysCount > 0 ? Math.round(overallCalories / daysCount) : 0,
          totalProtein: Math.round(overallProtein * 10) / 10,
          totalCarbs: Math.round(overallCarbs * 10) / 10,
          totalFat: Math.round(overallFat * 10) / 10,
        },
        data: dayList,
      };
    }

    // Group by Week:
    const weekMap: {
      [weekKey: string]: {
        weekKey: string;
        weekNumber: number;
        year: number;
        weekStart: string;
        weekEnd: string;
        totalCalories: number;
        totalProtein: number;
        totalCarbs: number;
        totalFat: number;
        daysLogged: Set<string>;
        days: {
          [date: string]: {
            date: string;
            dayOfWeek: string;
            totalCalories: number;
            totalProtein: number;
            totalCarbs: number;
            totalFat: number;
            meals: DailyMeal[];
          };
        };
        meals: DailyMeal[];
      };
    } = {};

    for (const meal of meals) {
      const { weekStart, weekEnd, weekKey, weekNumber, year } = this.getWeekRange(meal.mealDate);

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekKey,
          weekNumber,
          year,
          weekStart,
          weekEnd,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          daysLogged: new Set<string>(),
          days: {},
          meals: [],
        };
      }

      const w = weekMap[weekKey];
      w.totalCalories += meal.calories;
      w.totalProtein += meal.protein;
      w.totalCarbs += meal.carbs;
      w.totalFat += meal.fat;
      w.daysLogged.add(meal.mealDate);
      w.meals.push(meal);

      if (!w.days[meal.mealDate]) {
        w.days[meal.mealDate] = {
          date: meal.mealDate,
          dayOfWeek: this.getDayOfWeek(meal.mealDate),
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          meals: [],
        };
      }

      const d = w.days[meal.mealDate];
      d.totalCalories += meal.calories;
      d.totalProtein += meal.protein;
      d.totalCarbs += meal.carbs;
      d.totalFat += meal.fat;
      d.meals.push(meal);
    }

    const weekList = Object.values(weekMap)
      .map((w) => {
        const daysCount = w.daysLogged.size;
        return {
          weekKey: w.weekKey,
          weekNumber: w.weekNumber,
          year: w.year,
          weekStart: w.weekStart,
          weekEnd: w.weekEnd,
          totalCalories: Math.round(w.totalCalories),
          avgDailyCalories: daysCount > 0 ? Math.round(w.totalCalories / daysCount) : 0,
          totalProtein: Math.round(w.totalProtein * 10) / 10,
          totalCarbs: Math.round(w.totalCarbs * 10) / 10,
          totalFat: Math.round(w.totalFat * 10) / 10,
          daysCount,
          days: Object.values(w.days)
            .map((day) => ({
              ...day,
              totalCalories: Math.round(day.totalCalories),
              totalProtein: Math.round(day.totalProtein * 10) / 10,
              totalCarbs: Math.round(day.totalCarbs * 10) / 10,
              totalFat: Math.round(day.totalFat * 10) / 10,
            }))
            .sort((a, b) => b.date.localeCompare(a.date)),
          meals: w.meals,
        };
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    const overallCalories = weekList.reduce((sum, w) => sum + w.totalCalories, 0);
    const overallProtein = weekList.reduce((sum, w) => sum + w.totalProtein, 0);
    const overallCarbs = weekList.reduce((sum, w) => sum + w.totalCarbs, 0);
    const overallFat = weekList.reduce((sum, w) => sum + w.totalFat, 0);

    return {
      groupBy: 'week',
      summary: {
        totalMeals: meals.length,
        weeksCount: weekList.length,
        totalCalories: Math.round(overallCalories),
        totalProtein: Math.round(overallProtein * 10) / 10,
        totalCarbs: Math.round(overallCarbs * 10) / 10,
        totalFat: Math.round(overallFat * 10) / 10,
      },
      data: weekList,
    };
  }

  /**
   * 8. Dedicated Calendar View Endpoint.
   * Returns a date-indexed map ideal for monthly calendar grid components.
   */
  async getCalendarView(userId: string, query: CalendarQuery) {
    let startDate = query.startDate;
    let endDate = query.endDate;

    if (query.month) {
      // e.g. "2025-05" -> 2025-05-01 to 2025-05-31
      const [yearStr, monthStr] = query.month.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1-12
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      startDate = `${query.month}-01`;
      endDate = `${query.month}-${String(lastDay).padStart(2, '0')}`;
    }

    if (!startDate || !endDate) {
      // Default to current month
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() + 1;
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const mStr = String(month).padStart(2, '0');
      startDate = `${year}-${mStr}-01`;
      endDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    }

    const meals = await this.repository.listRangeChronological(userId, startDate, endDate);

    const calendarMap: {
      [date: string]: {
        date: string;
        dayOfWeek: string;
        totalCalories: number;
        totalProtein: number;
        totalCarbs: number;
        totalFat: number;
        mealsCount: number;
        mealTypes: string[];
        meals: DailyMeal[];
      };
    } = {};

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const meal of meals) {
      if (!calendarMap[meal.mealDate]) {
        calendarMap[meal.mealDate] = {
          date: meal.mealDate,
          dayOfWeek: this.getDayOfWeek(meal.mealDate),
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          mealsCount: 0,
          mealTypes: [],
          meals: [],
        };
      }

      const day = calendarMap[meal.mealDate];
      day.totalCalories += meal.calories;
      day.totalProtein += meal.protein;
      day.totalCarbs += meal.carbs;
      day.totalFat += meal.fat;
      day.mealsCount += 1;
      if (!day.mealTypes.includes(meal.mealType)) {
        day.mealTypes.push(meal.mealType);
      }
      day.meals.push(meal);

      totalCalories += meal.calories;
      totalProtein += meal.protein;
      totalCarbs += meal.carbs;
      totalFat += meal.fat;
    }

    const daysLogged = Object.keys(calendarMap).length;

    return {
      startDate,
      endDate,
      daysLogged,
      summary: {
        totalMeals: meals.length,
        totalCalories: Math.round(totalCalories),
        avgDailyCalories: daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0,
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
      },
      calendar: calendarMap,
    };
  }
}
