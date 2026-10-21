import { Router } from 'express';
import multer from 'multer';
import { DailyMealsController } from './dailyMeals.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new DailyMealsController();

// Multer memory storage configuration for uploaded meal images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, etc.) are allowed'));
    }
  },
});

// All daily meal routes require user authentication
router.use(authenticate);

// 1. Upload meal image and log in DB (AI analysis queued asynchronously)
router.post('/upload-and-log', upload.single('image'), controller.uploadAndLog);

// 2. Analyze meal image preview without saving to DB (for interactive review in UI)
router.post('/analyze-image', upload.single('image'), controller.analyzeImage);

// 3. Dedicated Calendar View for monthly/custom date grids
router.get('/calendar', controller.getCalendarView);

// 4. List meals with flexible timeline or grouping (groupBy=day, groupBy=week, groupBy=none)
router.get('/', controller.getMeals);

// 5. Manually log a meal
router.post('/', controller.createMeal);

// 6. Get single meal by ID
router.get('/:id', controller.getMealById);

// 7. Update an existing meal (supports partial or complete updates)
router.put('/:id', controller.updateMeal);
router.patch('/:id', controller.updateMeal);

// 8. Delete a meal
router.delete('/:id', controller.deleteMeal);

export default router;
