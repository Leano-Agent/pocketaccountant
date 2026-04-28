import { Router } from 'express';
import { AutoCategoryController } from '../controllers/auto-category.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new AutoCategoryController();

router.use(authenticateToken);

router.post('/suggest', controller.suggest.bind(controller));
router.post('/batch', controller.batchCategorize.bind(controller));
router.get('/categories', controller.categories.bind(controller));

export default router;
