import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { getPresignedUrl } from './upload.controller';

const router = Router();

// Endpoint to request a presigned URL. Requires JWT auth.
router.post('/presigned-url', authenticate, getPresignedUrl);

export default router;
