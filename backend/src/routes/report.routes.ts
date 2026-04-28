import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const controller = new ReportController();

router.use(authenticateToken);

router.get('/profit-loss', controller.profitLoss.bind(controller));
router.get('/balance-sheet', controller.balanceSheet.bind(controller));
router.get('/cash-flow', controller.cashFlow.bind(controller));
router.get('/dashboard', controller.summary.bind(controller));

export default router;
