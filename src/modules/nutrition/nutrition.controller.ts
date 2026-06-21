import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { env } from '../../config/env';
import { GeminiService } from '../../services/gemini.service';
import { UserProfilesService } from '../userProfiles/userProfiles.service';
import { AnalyzeImageSchema } from './nutrition.schema';

export class NutritionController {
  private userProfilesService: UserProfilesService;

  constructor() {
    this.userProfilesService = new UserProfilesService();
  }

  analyzeFoodImage = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // 1. Validate inputs
      const { imageKey, imageUrl } = AnalyzeImageSchema.parse(req.body);
      const userId = req.user!.userId;

      // 2. Fetch the user's profile to build the context
      let profile = null;
      try {
        profile = await this.userProfilesService.getProfileByUserId(userId);
      } catch (error) {
        // Handle missing profile gracefully
      }

      // Build personalized profile context
      let profileContext = '';
      if (profile) {
        profileContext = `User Profile Context:
- Goal: ${profile.goal}
- Diet Type: ${profile.dietType}
- Target Calories: ${profile.targetCalories ? `${profile.targetCalories} kcal` : 'Not specified'}
- Allergies: ${profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}
- Disliked Foods: ${profile.dislikedFoods && profile.dislikedFoods.length > 0 ? profile.dislikedFoods.join(', ') : 'None'}
- Health Conditions: ${profile.conditions && profile.conditions.length > 0 ? profile.conditions.join(', ') : 'None'}`;
      } else {
        profileContext = 'User Profile Context: No profile set up yet. Offer general nutrition advice.';
      }

      // 3. Load the image into a buffer and get mimeType
      let imageBuffer: Buffer;
      let mimeType = 'image/jpeg';

      const extension = imageKey.substring(imageKey.lastIndexOf('.')).toLowerCase();
      if (extension === '.png') mimeType = 'image/png';
      else if (extension === '.gif') mimeType = 'image/gif';
      else if (extension === '.webp') mimeType = 'image/webp';

      // Fetch from the S3 URL
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
      } catch (error) {
        console.error('Error downloading image from S3:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to download the uploaded image from S3. Make sure it was successfully uploaded.',
        });
      }

      // 4. Construct the prompt for Gemini
      const prompt = `You are a certified fitness trainer, expert nutritionist, and professional food analyst.
Analyze the provided food image and estimate the calories, macronutrients, and micronutrients for the items shown on the plate or the food product.
If it is a packaged food product (like Maggie, chips, biscuits), estimate based on the packaging/portion or provide estimates for standard servings of that food.
If it is a meal (plate of food), detect all distinct food items and provide individual estimations for each item.

Consider the user's nutritional profile, allergies, and goals if provided to customize your advice and recommendations.
${profileContext}

Provide a complete nutrition breakdown including:
1. "foodDetected": Array of objects containing "name", "confidence" (0 to 1), "estimatedWeightGrams", and "calories".
2. "calories": Object with "total" (number) and "range" (e.g. "400 - 450 kcal").
3. "macronutrients": Object with "carbohydrates", "protein", and "fat". Each macro should have "grams" and "percentage" of total calories (where 1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal). Make sure percentages sum up to roughly 100%.
4. "micronutrients": Array of objects containing "name" (e.g. Sodium, Sugar, Fiber, Iron, Calcium), "amount" (e.g. "500mg" or "10g"), and "percentageDailyValue" (based on typical 2000 kcal diet, number from 0 to 100). Include at least 4 key micronutrients relevant to the food item (e.g. Sodium, Sugar, Fiber, Saturated Fat).
5. "healthiness": Object containing "score" (number from 1 to 10), "isHealthy" (boolean), "rating" (e.g. "Very Healthy", "Moderately Healthy", "Unhealthy choice"), "explanation" (detailed explanation), "pros" (array of strings of healthy aspects), and "cons" (array of strings of unhealthy aspects).
6. "summary": One overall paragraph summarizing the nutritional value, if the portion size is appropriate, and if the food is healthy or not.
7. "recommendations": Array of actionable suggestions (e.g. "Add a side of leafy greens to increase fiber", "Reduce portion size to meet daily calorie goals", etc.).

Output must be in JSON and strictly adhere to the specified schema.`;

      // 5. Query Gemini Service with structured schema
      const responseSchema = {
        type: 'object',
        properties: {
          foodDetected: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                confidence: { type: 'number' },
                estimatedWeightGrams: { type: 'number' },
                calories: { type: 'number' },
              },
              required: ['name', 'confidence', 'estimatedWeightGrams', 'calories'],
            },
          },
          calories: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              range: { type: 'string' },
            },
            required: ['total'],
          },
          macronutrients: {
            type: 'object',
            properties: {
              carbohydrates: {
                type: 'object',
                properties: {
                  grams: { type: 'number' },
                  percentage: { type: 'number' },
                },
                required: ['grams', 'percentage'],
              },
              protein: {
                type: 'object',
                properties: {
                  grams: { type: 'number' },
                  percentage: { type: 'number' },
                },
                required: ['grams', 'percentage'],
              },
              fat: {
                type: 'object',
                properties: {
                  grams: { type: 'number' },
                  percentage: { type: 'number' },
                },
                required: ['grams', 'percentage'],
              },
            },
            required: ['carbohydrates', 'protein', 'fat'],
          },
          micronutrients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                percentageDailyValue: { type: 'number' },
              },
              required: ['name', 'amount', 'percentageDailyValue'],
            },
          },
          healthiness: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              isHealthy: { type: 'boolean' },
              rating: { type: 'string' },
              explanation: { type: 'string' },
              pros: {
                type: 'array',
                items: { type: 'string' },
              },
              cons: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['score', 'isHealthy', 'rating', 'explanation', 'pros', 'cons'],
          },
          summary: { type: 'string' },
          recommendations: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: [
          'foodDetected',
          'calories',
          'macronutrients',
          'micronutrients',
          'healthiness',
          'summary',
          'recommendations',
        ],
      };

      const result = await GeminiService.analyzeImage<any>(
        prompt,
        imageBuffer,
        mimeType,
        responseSchema
      );

      // 6. Return response
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      next(error);
    }
  };
}
