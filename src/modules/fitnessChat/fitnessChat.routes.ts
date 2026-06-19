import { Router } from 'express';
import { FitnessChatController } from './fitnessChat.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new FitnessChatController();

// All fitness chat routes require authentication
router.use(authenticate);

router.post('/', controller.askQuestion);

export default router;
