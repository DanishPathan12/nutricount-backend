import { Router } from 'express';
import { NutritionController } from './nutrition.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new NutritionController();

// Require JWT authentication for all nutrition endpoints
router.use(authenticate);

router.post('/analyze', controller.analyzeFoodImage);

export default router;
