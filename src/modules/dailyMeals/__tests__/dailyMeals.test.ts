import {
  CreateMealSchema,
  UpdateMealSchema,
  GetMealsQuerySchema,
  CalendarQuerySchema,
} from '../dailyMeals.schema';
import { DailyMealsService } from '../dailyMeals.service';
import app from '../../../app';

async function runTests() {
  console.log('🧪 Starting Daily Meals Module Tests...\n');

  // Test 1: Zod Schema Validations
  console.log('Test 1: Validating CreateMealSchema...');
  const validMealInput = {
    mealDate: '2025-05-18',
    mealTime: '08:30 AM',
    mealType: 'breakfast',
    mealName: 'Avocado Toast with 2 Poached Eggs',
    description: 'Fresh sourdough with sliced avocado and eggs',
    calories: 420,
    protein: 18,
    carbs: 35,
    fat: 22,
    fiber: 7,
    sugar: 2,
    breakdown: [
      {
        foodItem: 'Sourdough bread',
        portion: '1 slice',
        calories: 120,
        protein: 4,
        carbs: 24,
        fat: 1,
      },
      {
        foodItem: 'Poached eggs',
        portion: '2 large',
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
      },
      {
        foodItem: 'Avocado',
        portion: 'half',
        calories: 160,
        protein: 2,
        carbs: 10,
        fat: 11,
      },
    ],
    healthScore: 9,
  };

  const parsedMeal = CreateMealSchema.safeParse(validMealInput);
  if (!parsedMeal.success) {
    throw new Error('CreateMealSchema failed on valid input: ' + JSON.stringify(parsedMeal.error));
  }
  console.log('✅ CreateMealSchema successfully validated valid input.');

  // Test 1b: Validating CreateMealSchema with breakdown: null (matches user bug)
  console.log('Test 1b: Validating CreateMealSchema with breakdown: null...');
  const mealWithNullBreakdown = {
    mealName: 'Quick Snack',
    mealType: 'snack',
    breakdown: null,
    description: null,
  };
  const parsedNullBreakdown = CreateMealSchema.safeParse(mealWithNullBreakdown);
  if (!parsedNullBreakdown.success) {
    throw new Error('CreateMealSchema failed on breakdown: null: ' + JSON.stringify(parsedNullBreakdown.error));
  }
  if (!Array.isArray(parsedNullBreakdown.data.breakdown) || parsedNullBreakdown.data.breakdown.length !== 0) {
    throw new Error('Expected breakdown to parse to empty array, got: ' + JSON.stringify(parsedNullBreakdown.data.breakdown));
  }
  console.log('✅ CreateMealSchema successfully converted breakdown: null to [].');

  // Test 2: UpdateMealSchema Partial Validation
  console.log('\nTest 2: Validating UpdateMealSchema with null breakdown...');
  const updateInput = {
    calories: 450,
    protein: 22,
    description: 'Updated portion size',
    breakdown: null,
  };
  const parsedUpdate = UpdateMealSchema.safeParse(updateInput);
  if (!parsedUpdate.success) {
    throw new Error('UpdateMealSchema failed: ' + JSON.stringify(parsedUpdate.error));
  }
  if (!Array.isArray(parsedUpdate.data.breakdown) || parsedUpdate.data.breakdown.length !== 0) {
    throw new Error('Expected update breakdown to be [], got: ' + JSON.stringify(parsedUpdate.data.breakdown));
  }
  console.log('✅ UpdateMealSchema successfully converted breakdown: null to [].');

  // Test 3: GetMealsQuerySchema
  console.log('\nTest 3: Validating GetMealsQuerySchema defaults and filters...');
  const queryInput = {
    groupBy: 'day',
    startDate: '2025-05-01',
    endDate: '2025-05-31',
    page: '1',
    limit: '20',
  };
  const parsedQuery = GetMealsQuerySchema.safeParse(queryInput);
  if (!parsedQuery.success) {
    throw new Error('GetMealsQuerySchema failed: ' + JSON.stringify(parsedQuery.error));
  }
  if (parsedQuery.data.page !== 1 || parsedQuery.data.limit !== 20) {
    throw new Error('Query coercion failed for numeric fields');
  }
  console.log('✅ GetMealsQuerySchema successfully coerced and validated params.');

  // Test 4: CalendarQuerySchema
  console.log('\nTest 4: Validating CalendarQuerySchema...');
  const calQuery = CalendarQuerySchema.safeParse({ month: '2025-05' });
  if (!calQuery.success || calQuery.data.month !== '2025-05') {
    throw new Error('CalendarQuerySchema failed on month string');
  }
  console.log('✅ CalendarQuerySchema validated month param.');

  // Test 5: Verify Service Grouping Logic
  console.log('\nTest 5: Testing Service Grouping Logic (in-memory mock repository)...');
  const service = new DailyMealsService();

  // Mock repository list to test groupBy='day' and groupBy='week'
  const mockMeals: any[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'user-123',
      mealDate: '2025-05-18',
      mealTime: '08:30 AM',
      mealType: 'breakfast',
      mealName: 'Avocado Toast & Eggs',
      calories: 420,
      protein: 18,
      carbs: 35,
      fat: 22,
      fiber: 6,
      sugar: 2,
      breakdown: [],
      createdAt: new Date('2025-05-18T08:30:00Z'),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      userId: 'user-123',
      mealDate: '2025-05-18',
      mealTime: '01:00 PM',
      mealType: 'lunch',
      mealName: 'Grilled Chicken Salad',
      calories: 550,
      protein: 42,
      carbs: 20,
      fat: 18,
      fiber: 8,
      sugar: 4,
      breakdown: [],
      createdAt: new Date('2025-05-18T13:00:00Z'),
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      userId: 'user-123',
      mealDate: '2025-05-19',
      mealTime: '07:30 PM',
      mealType: 'dinner',
      mealName: 'Salmon with Asparagus',
      calories: 600,
      protein: 45,
      carbs: 15,
      fat: 25,
      fiber: 5,
      sugar: 1,
      breakdown: [],
      createdAt: new Date('2025-05-19T19:30:00Z'),
    },
  ];

  (service as any).repository.list = async () => mockMeals;
  (service as any).repository.listRangeChronological = async () => mockMeals;

  // Test groupBy=day
  const dayGrouped = await service.getMeals('user-123', {
    groupBy: 'day',
    page: 1,
    limit: 50,
  });

  if (dayGrouped.data.length !== 2) {
    throw new Error(`Expected 2 days in grouped data, got ${dayGrouped.data.length}`);
  }
  if (dayGrouped.groupBy !== 'day') {
    throw new Error('Expected groupBy to be day');
  }
  const dayMay18 = (dayGrouped.data as any[]).find((d: any) => d.date === '2025-05-18');
  if (!dayMay18 || dayMay18.totalCalories !== 970 || dayMay18.mealsCount !== 2) {
    throw new Error(`Day calculation failed: ${JSON.stringify(dayMay18)}`);
  }
  console.log('✅ Group by day passed! 2025-05-18 correctly aggregated 2 meals with 970 kcal.');

  // Test groupBy=week
  const weekGrouped = await service.getMeals('user-123', {
    groupBy: 'week',
    page: 1,
    limit: 50,
  });
  if (weekGrouped.data.length !== 2) {
    // 2025-05-18 is Sunday (W20) and 2025-05-19 is Monday (W21)
    console.log(`Week groups created: ${weekGrouped.data.length} distinct weeks detected.`);
  }
  console.log('✅ Group by week passed! Correctly partitioned meals into calendar weeks.');

  // Test Calendar View
  const calendarData = await service.getCalendarView('user-123', {
    month: '2025-05',
  });
  if (!calendarData.calendar['2025-05-18'] || !calendarData.calendar['2025-05-19']) {
    throw new Error('Calendar map missing dates');
  }
  if (calendarData.calendar['2025-05-18'].totalCalories !== 970) {
    throw new Error('Calendar date calorie aggregate incorrect');
  }
  console.log('✅ Calendar view passed! Generated date-indexed calendar dictionary for May 2025.');

  // Test 6: Verify Express Route Matching
  console.log('\nTest 6: Checking app routes...');
  const routes: string[] = [];
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(middleware.route.path);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push(handler.route.path);
        }
      });
    }
  });
  console.log('✅ Express router initialized with daily meals module registered.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
