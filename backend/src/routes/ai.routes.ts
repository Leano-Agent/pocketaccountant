import { Router } from 'express';
import { AIChatController } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new AIChatController();

router.use(authenticateToken);

router.post('/chat', controller.chat.bind(controller));
router.get('/summary', controller.summary.bind(controller));

export default router;
