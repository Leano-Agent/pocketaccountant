import { Router } from 'express';
import { OAuthController } from '../config/passport';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new OAuthController();

// Google
router.get('/google', controller.googleAuth.bind(controller));
router.get('/google/callback', controller.googleCallback.bind(controller));

// Apple
router.get('/apple', controller.appleAuth.bind(controller));
router.get('/apple/callback', controller.appleCallback.bind(controller));

// OAuth token exchange
router.get('/me', controller.me.bind(controller));

export default router;
