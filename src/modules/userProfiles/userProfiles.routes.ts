import { Router } from 'express';
import { UserProfilesController } from './userProfiles.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new UserProfilesController();

// All user profile routes require authentication
router.use(authenticate);

router.post('/', controller.create);
router.get('/me', controller.getMe);
router.get('/:userId', controller.getByUserId);
router.put('/me', controller.updateMe);
router.put('/:userId', controller.updateByUserId);
router.delete('/me', controller.deleteMe);
router.delete('/:userId', controller.deleteByUserId);
router.get('/', controller.list);

export default router;
