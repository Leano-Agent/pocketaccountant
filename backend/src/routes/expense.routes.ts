import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authenticateToken } from '../middleware/auth';

export const expenseRouter = Router();

// Apply auth middleware to all routes
expenseRouter.use(authenticateToken);

expenseRouter.post('/', ExpenseController.createExpense);
expenseRouter.get('/', ExpenseController.getExpenses);
expenseRouter.get('/:id', ExpenseController.getExpenseById);
expenseRouter.put('/:id', ExpenseController.updateExpense);
expenseRouter.delete('/:id', ExpenseController.deleteExpense);