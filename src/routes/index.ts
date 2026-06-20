import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userProfilesRoutes from '../modules/userProfiles/userProfiles.routes';
import fitnessChatRoutes from '../modules/fitnessChat/fitnessChat.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import nutritionRoutes from '../modules/nutrition/nutrition.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user-profiles', userProfilesRoutes);
router.use('/fitness-chat', fitnessChatRoutes);
router.use('/upload', uploadRoutes);
router.use('/nutrition', nutritionRoutes);

export default router;
