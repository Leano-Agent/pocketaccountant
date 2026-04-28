import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new ClientController();

router.use(authenticateToken);

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
