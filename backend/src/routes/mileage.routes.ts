import { Router } from 'express';
import { MileageController } from '../controllers/mileage.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new MileageController();

router.use(authenticateToken);

router.get('/', controller.list.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));
router.get('/export', controller.export.bind(controller));
router.get('/rate', controller.getRate.bind(controller));

export default router;
