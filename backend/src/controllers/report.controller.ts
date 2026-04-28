import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Expense } from '../models/Expense';
import { Invoice } from '../models/Invoice';
import { AuthRequest } from '../middleware/auth';

export class ReportController {
    // Profit & Loss Statement
    async profitLoss(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { startDate, endDate } = req.query;

            const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const end = endDate ? new Date(endDate as string) : new Date();

            const expenseRepo = AppDataSource.getRepository(Expense);
            const invoiceRepo = AppDataSource.getRepository(Invoice);

            // Get all expenses in date range
            const expenses = await expenseRepo.createQueryBuilder('expense')
                .where('expense.userId = :userId', { userId })
                .andWhere('expense.date >= :start', { start: start.toISOString().split('T')[0] })
                .andWhere('expense.date <= :end', { end: end.toISOString().split('T')[0] })
                .getMany();

            // Get paid invoices (revenue) in date range
            const invoices = await invoiceRepo.createQueryBuilder('invoice')
                .where('invoice.userId = :userId', { userId })
                .andWhere('invoice.status IN (:...statuses)', { statuses: ['paid', 'partial'] })
                .andWhere('invoice.paidAt >= :start', { start })
                .andWhere('invoice.paidAt <= :end', { end })
                .getMany();

            // Aggregate expenses by category
            const expensesByCategory: Record<string, number> = {};
            expenses.forEach(e => {
                const cat = e.category || 'Uncategorized';
                expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(e.amount);
            });

            const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

            // Revenue from invoices
            const totalRevenue = invoices.reduce((sum, inv) => {
                const paid = Number(inv.paidAmount);
                return sum + (paid > 0 ? paid : Number(inv.total));
            }, 0);

            const netProfit = totalRevenue - totalExpenses;

            res.json({
                data: {
                    period: {
                        start: start.toISOString().split('T')[0],
                        end: end.toISOString().split('T')[0],
                    },
                    revenue: {
                        total: totalRevenue,
                        fromInvoices: totalRevenue,
                        count: invoices.length,
                    },
                    expenses: {
                        total: totalExpenses,
                        byCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
                            category,
                            amount,
                            percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
                        })),
                        count: expenses.length,
                    },
                    netProfit,
                    isProfitable: netProfit >= 0,
                    profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Balance Sheet (simplified)
    async balanceSheet(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const asAt = (req.query.asAt as string) || new Date().toISOString().split('T')[0];

            const expenseRepo = AppDataSource.getRepository(Expense);
            const invoiceRepo = AppDataSource.getRepository(Invoice);

            // Get all expenses (debits/costs)
            const expenses = await expenseRepo.find({ where: { userId: userId as any } });

            // Get all invoices (receivables)
            const invoices = await invoiceRepo.find({ where: { userId: userId as any } });

            // Assets
            const accountsReceivable = invoices
                .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
                .reduce((sum, i) => sum + (Number(i.total) - Number(i.paidAmount)), 0);

            const paidInvoices = invoices
                .filter(i => i.status === 'paid')
                .reduce((sum, i) => sum + Number(i.total), 0);

            // Liabilities
            const outstandingExpenses = expenses
                .filter(e => e.category === 'accounts_payable' || e.category === 'credit_card')
                .reduce((sum, e) => sum + Number(e.amount), 0);

            // Equity
            const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalRevenue = invoices
                .filter(i => i.status === 'paid' || i.status === 'partial')
                .reduce((sum, i) => sum + Number(i.paidAmount > 0 ? i.paidAmount : i.total), 0);

            const retainedEarnings = totalRevenue - totalExpenses;

            const totalAssets = accountsReceivable + paidInvoices;
            const totalLiabilities = outstandingExpenses;
            const totalEquity = retainedEarnings;

            res.json({
                data: {
                    asAt,
                    assets: {
                        total: totalAssets,
                        accountsReceivable,
                        cashAndBank: paidInvoices,
                    },
                    liabilities: {
                        total: totalLiabilities,
                        outstandingExpenses,
                    },
                    equity: {
                        total: totalEquity,
                        retainedEarnings,
                    },
                    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Cash Flow Statement (simplified)
    async cashFlow(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const months = parseInt(req.query.months as string) || 6;

            const expenseRepo = AppDataSource.getRepository(Expense);
            const invoiceRepo = AppDataSource.getRepository(Invoice);

            const now = new Date();
            const periods: { label: string; start: string; end: string }[] = [];

            for (let i = months - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                periods.push({
                    label: d.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }),
                    start: d.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0],
                });
            }

            const cashflowData = await Promise.all(periods.map(async (period) => {
                // Net income (from invoices paid)
                const invoices = await invoiceRepo.createQueryBuilder('inv')
                    .where('inv.userId = :userId', { userId })
                    .andWhere('inv.status IN (:...statuses)', { statuses: ['paid', 'partial'] })
                    .andWhere('inv.paidAt >= :start', { start: new Date(period.start) })
                    .andWhere('inv.paidAt <= :end', { end: new Date(period.end + 'T23:59:59') })
                    .getMany();

                const cashIn = invoices.reduce((sum, inv) => {
                    return sum + Number(inv.paidAmount > 0 ? inv.paidAmount : inv.total);
                }, 0);

                // Cash out (expenses)
                const expenses = await expenseRepo.createQueryBuilder('exp')
                    .where('exp.userId = :userId', { userId })
                    .andWhere('exp.date >= :start', { start: period.start })
                    .andWhere('exp.date <= :end', { end: period.end })
                    .getMany();

                const cashOut = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

                return {
                    period: period.label,
                    cashIn,
                    cashOut,
                    netCashFlow: cashIn - cashOut,
                };
            }));

            const totalIn = cashflowData.reduce((s, p) => s + p.cashIn, 0);
            const totalOut = cashflowData.reduce((s, p) => s + p.cashOut, 0);

            res.json({
                data: {
                    monthly: cashflowData,
                    summary: {
                        totalIn,
                        totalOut,
                        netTotal: totalIn - totalOut,
                    },
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Dashboard Summary
    async dashboardSummary(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;

            const expenseRepo = AppDataSource.getRepository(Expense);
            const invoiceRepo = AppDataSource.getRepository(Invoice);

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // This month's expenses
            const monthExpenses = await expenseRepo.createQueryBuilder('exp')
                .where('exp.userId = :userId', { userId })
                .andWhere('exp.date >= :start', { start: monthStart.toISOString().split('T')[0] })
                .andWhere('exp.date <= :end', { end: monthEnd.toISOString().split('T')[0] })
                .getMany();

            const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

            // This month's paid invoices
            const monthInvoices = await invoiceRepo.createQueryBuilder('inv')
                .where('inv.userId = :userId', { userId })
                .andWhere('inv.status IN (:...statuses)', { statuses: ['paid', 'partial'] })
                .andWhere('inv.paidAt >= :start', { start: monthStart })
                .andWhere('inv.paidAt <= :end', { end: monthEnd })
                .getMany();

            const totalRevenue = monthInvoices.reduce((s, inv) => s + Number(inv.paidAmount > 0 ? inv.paidAmount : inv.total), 0);

            // Overdue invoices
            const overdueInvoices = await invoiceRepo.createQueryBuilder('inv')
                .where('inv.userId = :userId', { userId })
                .andWhere('inv.status IN (:...statuses)', { statuses: ['sent', 'partial'] })
                .andWhere('inv.dueDate < :today', { today: now.toISOString().split('T')[0] })
                .getMany();

            const totalOverdue = overdueInvoices.reduce((s, inv) => s + (Number(inv.total) - Number(inv.paidAmount)), 0);

            // Spending by category (top 5 for this month)
            const spendingByCategory: Record<string, number> = {};
            monthExpenses.forEach(e => {
                const cat = e.category || 'Other';
                spendingByCategory[cat] = (spendingByCategory[cat] || 0) + Number(e.amount);
            });

            const topCategories = Object.entries(spendingByCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([category, amount]) => ({
                    category,
                    amount,
                    percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
                }));

            res.json({
                data: {
                    currentMonth: {
                        revenue: totalRevenue,
                        expenses: totalExpenses,
                        net: totalRevenue - totalExpenses,
                        expenseCount: monthExpenses.length,
                        invoiceCount: monthInvoices.length,
                    },
                    overdue: {
                        count: overdueInvoices.length,
                        total: totalOverdue,
                    },
                    topCategories,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
