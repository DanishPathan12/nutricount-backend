import fs from 'fs';
import path from 'path';
import { GeminiService } from '../services/gemini.service';

async function run() {
  try {
    console.log('Starting Gemini multimodal test...');
    const imagePath = path.join(__dirname, '../../public/uploads/images/4803e007-2f22-4913-bcc7-c40b28d74e4b/6477f8db-d975-445b-a48f-73aef20b6a75.png');
    if (!fs.existsSync(imagePath)) {
      console.error('Test image not found at:', imagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = 'image/png';
    const prompt = 'Analyze this food item, identify it, estimate its calories and macros/micros, and describe if it is healthy or not.';

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

    console.log('Analysis result successful! Result details:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Multimodal test failed:', error);
  }
}

run();
