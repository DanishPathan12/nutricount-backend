import { Router } from 'express';
import { FitnessChatController } from './fitnessChat.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new FitnessChatController();

// All fitness chat and history routes require authentication
router.use(authenticate);

// Send message / Ask question
// Body: { message: string, sessionId?: string }
router.post('/', controller.askQuestion);
router.post('/messages', controller.askQuestion);

// Sessions endpoints
router.get('/sessions', controller.getSessions);
router.post('/sessions', controller.createSession);
router.delete('/sessions', controller.clearAllSessions);

router.get('/sessions/:sessionId', controller.getSessionById);
router.patch('/sessions/:sessionId', controller.updateSessionTitle);
router.put('/sessions/:sessionId', controller.updateSessionTitle);
router.delete('/sessions/:sessionId', controller.deleteSession);

// Session message endpoints
router.get('/sessions/:sessionId/messages', controller.getSessionMessages);
router.post('/sessions/:sessionId/messages', controller.sendMessageToSession);

export default router;
