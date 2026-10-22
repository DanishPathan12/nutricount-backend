import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { dailyMeals, type DailyMeal, type NewDailyMeal, type MealType } from '../../db/schema/dailyMeals';

export interface DailyMealsListFilter {
  userId: string;
  startDate?: string;
  endDate?: string;
  mealType?: MealType;
  limit?: number;
  offset?: number;
}

export class DailyMealsRepository {
  /**
   * Create a new meal log.
   */
  async create(data: NewDailyMeal): Promise<DailyMeal> {
    const result = await db.insert(dailyMeals).values(data).returning();
    return result[0];
  }

  /**
   * Find a specific meal by ID and user ID.
   */
  async findById(id: string, userId: string): Promise<DailyMeal | undefined> {
    const result = await db
      .select()
      .from(dailyMeals)
      .where(and(eq(dailyMeals.id, id), eq(dailyMeals.userId, userId)))
      .limit(1);
    return result[0];
  }

  /**
   * Update an existing meal by ID and user ID.
   */
  async update(id: string, userId: string, data: Partial<NewDailyMeal>): Promise<DailyMeal | undefined> {
    const result = await db
      .update(dailyMeals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(dailyMeals.id, id), eq(dailyMeals.userId, userId)))
      .returning();
    return result[0];
  }

  /**
   * Delete a meal log by ID and user ID.
   */
  async delete(id: string, userId: string): Promise<DailyMeal | undefined> {
    const result = await db
      .delete(dailyMeals)
      .where(and(eq(dailyMeals.id, id), eq(dailyMeals.userId, userId)))
      .returning();
    return result[0];
  }

  /**
   * List meals with filtering and pagination.
   */
  async list(filter: DailyMealsListFilter): Promise<DailyMeal[]> {
    const conditions = [eq(dailyMeals.userId, filter.userId)];

    if (filter.startDate) {
      conditions.push(gte(dailyMeals.mealDate, filter.startDate));
    }
    if (filter.endDate) {
      conditions.push(lte(dailyMeals.mealDate, filter.endDate));
    }
    if (filter.mealType) {
      conditions.push(eq(dailyMeals.mealType, filter.mealType));
    }

    let query = db
      .select()
      .from(dailyMeals)
      .where(and(...conditions))
      .orderBy(desc(dailyMeals.mealDate), desc(dailyMeals.createdAt));

    if (filter.limit !== undefined) {
      query = query.limit(filter.limit) as any;
    }
    if (filter.offset !== undefined) {
      query = query.offset(filter.offset) as any;
    }

    return query;
  }

  /**
   * Count meals matching filters.
   */
  async count(filter: Omit<DailyMealsListFilter, 'limit' | 'offset'>): Promise<number> {
    const conditions = [eq(dailyMeals.userId, filter.userId)];

    if (filter.startDate) {
      conditions.push(gte(dailyMeals.mealDate, filter.startDate));
    }
    if (filter.endDate) {
      conditions.push(lte(dailyMeals.mealDate, filter.endDate));
    }
    if (filter.mealType) {
      conditions.push(eq(dailyMeals.mealType, filter.mealType));
    }

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dailyMeals)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  /**
   * List all meals for a date range in chronological order (for calendar/timeline views).
   */
  async listRangeChronological(userId: string, startDate: string, endDate: string): Promise<DailyMeal[]> {
    return db
      .select()
      .from(dailyMeals)
      .where(
        and(
          eq(dailyMeals.userId, userId),
          gte(dailyMeals.mealDate, startDate),
          lte(dailyMeals.mealDate, endDate)
        )
      )
      .orderBy(asc(dailyMeals.mealDate), asc(dailyMeals.createdAt));
  }
}
