import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Budget } from '../models/Budget';
import { Category } from '../models/Category';
import { AuthRequest } from '../middleware/auth';

export class BudgetController {
    static async createBudget(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const budgetRepository = AppDataSource.getRepository(Budget);
            const categoryRepository = AppDataSource.getRepository(Category);

            // Validate category exists
            const category = await categoryRepository.findOne({
                where: { id: req.body.categoryId }
            });

            if (!category) {
                return res.status(404).json({ message: 'Category not found' });
            }

            const budgetData = {
                ...req.body,
                user: req.user,
                category: category
            };
            
            const budget = budgetRepository.create(budgetData);
            const result = await budgetRepository.save(budget);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Error creating budget:', error);
            return res.status(500).json({ message: 'Error creating budget' });
        }
    }

    static async getBudgets(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const budgetRepository = AppDataSource.getRepository(Budget);
            const budgets = await budgetRepository.find({
                where: { user: { id: req.user.id } },
                relations: ['category'],
                order: { start_date: 'DESC' }
            });
            return res.json(budgets);
        } catch (error) {
            console.error('Error fetching budgets:', error);
            return res.status(500).json({ message: 'Error fetching budgets' });
        }
    }

    static async getBudgetById(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const budgetRepository = AppDataSource.getRepository(Budget);
            const budget = await budgetRepository.findOne({
                where: { id: req.params.id as string, user: { id: req.user.id } },
                relations: ['category']
            });
            
            if (!budget) {
                return res.status(404).json({ message: 'Budget not found' });
            }

            return res.json(budget);
        } catch (error) {
            console.error('Error fetching budget:', error);
            return res.status(500).json({ message: 'Error fetching budget' });
        }
    }

    static async updateBudget(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const budgetRepository = AppDataSource.getRepository(Budget);
            const budget = await budgetRepository.findOne({
                where: { id: req.params.id as string, user: { id: req.user.id } }
            });

            if (!budget) {
                return res.status(404).json({ message: 'Budget not found' });
            }

            // If category is being updated, validate it exists
            if (req.body.categoryId) {
                const categoryRepository = AppDataSource.getRepository(Category);
                const category = await categoryRepository.findOne({
                    where: { id: req.body.categoryId }
                });

                if (!category) {
                    return res.status(404).json({ message: 'Category not found' });
                }
                budget.category = category;
            }

            budgetRepository.merge(budget, req.body);
            const result = await budgetRepository.save(budget);
            return res.json(result);
        } catch (error) {
            console.error('Error updating budget:', error);
            return res.status(500).json({ message: 'Error updating budget' });
        }
    }

    static async deleteBudget(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const budgetRepository = AppDataSource.getRepository(Budget);
            const budget = await budgetRepository.findOne({
                where: { id: req.params.id as string, user: { id: req.user.id } }
            });

            if (!budget) {
                return res.status(404).json({ message: 'Budget not found' });
            }

            await budgetRepository.remove(budget);
            return res.status(204).send();
        } catch (error) {
            console.error('Error deleting budget:', error);
            return res.status(500).json({ message: 'Error deleting budget' });
        }
    }

    static async getBudgetSummary(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const budgetRepository = AppDataSource.getRepository(Budget);
            const budgets = await budgetRepository.find({
                where: { 
                    user: { id: req.user.id },
                    is_active: true 
                },
                relations: ['category']
            });

            // Calculate current month's budget vs actual
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const summary = budgets.map(budget => {
                // For simplicity, we'll calculate monthly budget
                // In a real app, you'd calculate based on period (daily, weekly, monthly, yearly)
                let monthlyBudget = budget.amount;
                
                if (budget.period === 'weekly') {
                    monthlyBudget = budget.amount * 4.33; // Average weeks in month
                } else if (budget.period === 'yearly') {
                    monthlyBudget = budget.amount / 12;
                } else if (budget.period === 'daily') {
                    monthlyBudget = budget.amount * 30.44; // Average days in month
                }

                return {
                    id: budget.id,
                    category: budget.category,
                    budgetAmount: monthlyBudget,
                    currency: budget.currency,
                    period: budget.period,
                    startDate: budget.start_date,
                    endDate: budget.end_date,
                    isActive: budget.is_active
                };
            });

            return res.json(summary);
        } catch (error) {
            console.error('Error fetching budget summary:', error);
            return res.status(500).json({ message: 'Error fetching budget summary' });
        }
    }
}