import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userProfilesRoutes from '../modules/userProfiles/userProfiles.routes';
import fitnessChatRoutes from '../modules/fitnessChat/fitnessChat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user-profiles', userProfilesRoutes);
router.use('/fitness-chat', fitnessChatRoutes);

export default router;
