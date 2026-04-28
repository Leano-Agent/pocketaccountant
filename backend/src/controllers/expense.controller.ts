import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Expense } from '../models/Expense';
import { AuthRequest } from '../middleware/auth';

export class ExpenseController {
    static async createExpense(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const expenseRepository = AppDataSource.getRepository(Expense);
            const expenseData = {
                ...req.body,
                user: req.user
            };
            const expense = expenseRepository.create(expenseData);
            const result = await expenseRepository.save(expense);
            return res.status(201).json(result);
        } catch (error) {
            console.error('Error creating expense:', error);
            return res.status(500).json({ message: 'Error creating expense' });
        }
    }

    static async getExpenses(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const expenseRepository = AppDataSource.getRepository(Expense);
            const expenses = await expenseRepository.find({
                where: { user: { id: req.user.id } },
                relations: ['category']
            });
            return res.json(expenses);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return res.status(500).json({ message: 'Error fetching expenses' });
        }
    }

    static async getExpenseById(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const expenseRepository = AppDataSource.getRepository(Expense);
            const expense = await expenseRepository.findOne({
                where: { id: req.params.id as string, user: { id: req.user.id } },
                relations: ['category']
            });
            
            if (!expense) {
                return res.status(404).json({ message: 'Expense not found' });
            }

            return res.json(expense);
        } catch (error) {
            console.error('Error fetching expense:', error);
            return res.status(500).json({ message: 'Error fetching expense' });
        }
    }

    static async updateExpense(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const expenseRepository = AppDataSource.getRepository(Expense);
            const expense = await expenseRepository.findOne({
                where: { id: req.params.id as string, user: { id: req.user.id } }
            });

            if (!expense) {
                return res.status(404).json({ message: 'Expense not found' });
            }

            expenseRepository.merge(expense, req.body);
            const result = await expenseRepository.save(expense);
            return res.json(result);
        } catch (error) {
            console.error('Error updating expense:', error);
            return res.status(500).json({ message: 'Error updating expense' });
        }
    }

    static async deleteExpense(req: AuthRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            const expenseRepository = AppDataSource.getRepository(Expense);
            const expense = await expenseRepository.findOne({
                where: { id: req.params.id as string, user: { id: req.user.id } }
            });

            if (!expense) {
                return res.status(404).json({ message: 'Expense not found' });
            }

            await expenseRepository.remove(expense);
            return res.status(204).send();
        } catch (error) {
            console.error('Error deleting expense:', error);
            return res.status(500).json({ message: 'Error deleting expense' });
        }
    }
}