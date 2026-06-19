import { Request, Response, NextFunction } from 'express';
import { UserProfilesService } from '../userProfiles/userProfiles.service';
import { GeminiService } from '../../services/gemini.service';
import { AskQuestionSchema } from './fitnessChat.schema';

export class FitnessChatController {
  private userProfilesService: UserProfilesService;

  constructor() {
    this.userProfilesService = new UserProfilesService();
  }

  askQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validate the user message input
      const { message } = AskQuestionSchema.parse(req.body);
      const userId = req.user!.userId;

      // 2. Fetch the user's profile to build the context (handle missing profile gracefully)
      let profile = null;
      try {
        profile = await this.userProfilesService.getProfileByUserId(userId);
      } catch (error) {
        // Profile not set up yet
      }

      // 3. Build personalized context for Gemini
      let profileContext = '';
      if (profile) {
        profileContext = `User Profile Context:
- Name: ${profile.firstName} ${profile.lastName}
- Age: ${profile.age} years old
- Gender: ${profile.gender}
- Height: ${profile.heightCm} cm
- Weight: ${profile.weightKg} kg
- Target Weight: ${profile.targetWeightKg ? `${profile.targetWeightKg} kg` : 'Not specified'}
- Activity Level: ${profile.activityLevel}
- Fitness/Nutrition Goal: ${profile.goal}
- Diet Type: ${profile.dietType}
- Allergies: ${profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'}
- Disliked Foods: ${profile.dislikedFoods && profile.dislikedFoods.length > 0 ? profile.dislikedFoods.join(', ') : 'None'}
- Preferred Cuisine: ${profile.preferredCuisine && profile.preferredCuisine.length > 0 ? profile.preferredCuisine.join(', ') : 'None'}
- Health Conditions: ${profile.conditions && profile.conditions.length > 0 ? profile.conditions.join(', ') : 'None'}
- Medications: ${profile.medications && profile.medications.length > 0 ? profile.medications.join(', ') : 'None'}
- Lifestyle: Smoking - ${profile.smoking ? 'Yes' : 'No'}, Alcohol - ${profile.alcohol ? 'Yes' : 'No'}
- Workout Frequency: ${profile.workoutDaysPerWeek !== null ? `${profile.workoutDaysPerWeek} days/week` : 'Not specified'}
- Sleep: ${profile.sleepHours !== null ? `${profile.sleepHours} hours/night` : 'Not specified'}`;
      } else {
        profileContext = `User Profile Context:
- The user has not completed their profile setup yet. Avoid personalized metrics references, and politely remind/encourage them to set up their profile for tailored suggestions.`;
      }

      // 4. Construct the prompt for Gemini
      const prompt = `You are a certified fitness trainer and expert nutritionist on the Nutricount app.
Your objective is to provide evidence-based, supportive, and clear answers to fitness, workout, diet, or nutrition questions.
Use the provided User Profile Context to personalize your advice where appropriate. If profile metrics are missing, provide general guidance and suggest completing their profile.
Keep your answer structured with clean markdown (using headers, bullet points, or bold text) to make it readable and user-friendly.

---
${profileContext}
---

Question: ${message}

Response:`;

      // 5. Query Gemini Service
      const response = await GeminiService.generateText(prompt);

      // 6. Return response
      res.status(200).json({
        success: true,
        data: {
          response,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
