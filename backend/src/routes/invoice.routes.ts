import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new InvoiceController();

router.use(authenticateToken);

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.patch('/:id/status', controller.updateStatus.bind(controller));
router.post('/:id/payment', controller.recordPayment.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
