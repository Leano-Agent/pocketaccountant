import { Router } from 'express';
import { TaxController } from '../controllers/tax.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new TaxController();

router.use(authenticateToken);

router.get('/calendar', controller.calendar.bind(controller));
router.get('/returns', controller.list.bind(controller));
router.post('/returns', controller.create.bind(controller));
router.patch('/returns/:id', controller.updateStatus.bind(controller));

export default router;
