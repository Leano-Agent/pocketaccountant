import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All budget routes require authentication
router.use(authenticateToken);

// Create a new budget
router.post('/', BudgetController.createBudget);

// Get all budgets for the authenticated user
router.get('/', BudgetController.getBudgets);

// Get budget summary (budget vs actual)
router.get('/summary', BudgetController.getBudgetSummary);

// Get a specific budget by ID
router.get('/:id', BudgetController.getBudgetById);

// Update a budget
router.put('/:id', BudgetController.updateBudget);

// Delete a budget
router.delete('/:id', BudgetController.deleteBudget);

export const budgetRouter = router;