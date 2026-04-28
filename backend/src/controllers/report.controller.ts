import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { AuthRequest } from '../middleware/auth';

interface PnLItem {
    total: number;
    category: string;
    count: number;
}

export class ReportController {
    // Profit & Loss Statement
    async profitLoss(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const startDate = req.query.startDate as string || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
            const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];

            // Revenue from paid invoices
            const revenue = await AppDataSource
                .createQueryBuilder()
                .select('COALESCE(SUM(i.total), 0)', 'total')
                .from('invoices', 'i')
                .where('i.userId = :userId', { userId })
                .andWhere('i.status = :status', { status: 'paid' })
                .andWhere('i.paidAt >= :startDate', { startDate })
                .andWhere('i.paidAt <= :endDate', { endDate })
                .getRawOne();

            // Expenses by category
            const expenses = await AppDataSource
                .createQueryBuilder()
                .select('e.category', 'category')
                .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
                .addSelect('COUNT(e.id)', 'count')
                .from('expenses', 'e')
                .where('e.userId = :userId', { userId })
                .andWhere('e.date >= :startDate', { startDate })
                .andWhere('e.date <= :endDate', { endDate })
                .groupBy('e.category')
                .orderBy('total', 'DESC')
                .getRawMany();

            const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.total), 0);
            const totalRevenue = Number(revenue?.total || 0);
            const netProfit = totalRevenue - totalExpenses;
            const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            res.json({
                data: {
                    period: { startDate, endDate },
                    revenue: { total: totalRevenue },
                    expenses: {
                        total: totalExpenses,
                        byCategory: expenses,
                        count: expenses.length,
                    },
                    summary: {
                        netProfit: Math.round(netProfit * 100) / 100,
                        profitMargin: Math.round(margin * 100) / 100,
                        isProfitable: netProfit >= 0,
                    },
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Balance Sheet
    async balanceSheet(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;

            // Assets: Total paid invoices (cash) + unpaid invoices (receivables)
            const paidInvoices = await AppDataSource
                .createQueryBuilder()
                .select('COALESCE(SUM(i.total), 0)', 'total')
                .from('invoices', 'i')
                .where('i.userId = :userId', { userId })
                .andWhere('i.status = :status', { status: 'paid' })
                .getRawOne();

            const unpaidInvoices = await AppDataSource
                .createQueryBuilder()
                .select('COALESCE(SUM(i.total), 0)', 'total')
                .from('invoices', 'i')
                .where('i.userId = :userId', { userId })
                .andWhere('i.status IN (:...statuses)', { statuses: ['sent', 'overdue'] })
                .getRawOne();

            const cashInBank = Number(paidInvoices?.total || 0);
            const accountsReceivable = Number(unpaidInvoices?.total || 0);

            // Liabilities: Total unpaid expenses
            const liabilities = await AppDataSource
                .createQueryBuilder()
                .select('COALESCE(SUM(e.amount), 0)', 'total')
                .from('expenses', 'e')
                .where('e.userId = :userId', { userId })
                .getRawOne();

            const totalAssets = cashInBank + accountsReceivable;
            const totalLiabilities = Number(liabilities?.total || 0);
            const equity = totalAssets - totalLiabilities;

            res.json({
                data: {
                    assets: {
                        total: totalAssets,
                        cashInBank,
                        accountsReceivable,
                    },
                    liabilities: {
                        total: totalLiabilities,
                    },
                    equity: {
                        total: Math.round(equity * 100) / 100,
                        retainedEarnings: Math.round(equity * 100) / 100,
                    },
                    totalLiabilitiesAndEquity: totalLiabilities + equity,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Cash Flow
    async cashFlow(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const monthsBack = parseInt(req.query.months as string) || 6;
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - monthsBack);

            // Monthly income from invoices
            const income = await AppDataSource
                .createQueryBuilder()
                .select("strftime('%Y-%m', i.paidAt)", 'month')
                .addSelect('COALESCE(SUM(i.total), 0)', 'total')
                .from('invoices', 'i')
                .where('i.userId = :userId', { userId })
                .andWhere('i.status = :status', { status: 'paid' })
                .andWhere('i.paidAt >= :start', { start: startDate.toISOString().split('T')[0] })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();

            // Monthly expenses
            const expenses = await AppDataSource
                .createQueryBuilder()
                .select("strftime('%Y-%m', e.date)", 'month')
                .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
                .from('expenses', 'e')
                .where('e.userId = :userId', { userId })
                .andWhere('e.date >= :start', { start: startDate.toISOString().split('T')[0] })
                .groupBy('month')
                .orderBy('month', 'ASC')
                .getRawMany();

            // Build monthly breakdown
            const months: string[] = [];
            for (let i = monthsBack - 1; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                months.push(d.toISOString().slice(0, 7));
            }

            const flow = months.map(month => {
                const inc = income.find((i: any) => i.month === month);
                const exp = expenses.find((e: any) => e.month === month);
                const inflow = Number(inc?.total || 0);
                const outflow = Number(exp?.total || 0);
                return {
                    month,
                    inflow,
                    outflow,
                    net: inflow - outflow,
                };
            });

            const totalInflow = flow.reduce((s: number, m: any) => s + m.inflow, 0);
            const totalOutflow = flow.reduce((s: number, m: any) => s + m.outflow, 0);

            res.json({
                data: {
                    months: flow,
                    summary: {
                        totalInflow,
                        totalOutflow,
                        netCashFlow: totalInflow - totalOutflow,
                        averageMonthlyInflow: Math.round(totalInflow / months.length * 100) / 100,
                        averageMonthlyOutflow: Math.round(totalOutflow / months.length * 100) / 100,
                    },
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Dashboard Summary
    async summary(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const thisMonthStart = new Date();
            thisMonthStart.setDate(1);

            // Monthly expense
            const monthlyExpense = await AppDataSource
                .createQueryBuilder()
                .select('COALESCE(SUM(e.amount), 0)', 'total')
                .from('expenses', 'e')
                .where('e.userId = :userId', { userId })
                .andWhere('e.date >= :start', { start: thisMonthStart.toISOString().split('T')[0] })
                .getRawOne();

            // Invoice stats
            const invoices = await AppDataSource
                .createQueryBuilder()
                .select('i.status', 'status')
                .addSelect('COUNT(i.id)', 'count')
                .addSelect('COALESCE(SUM(i.total), 0)', 'total')
                .from('invoices', 'i')
                .where('i.userId = :userId', { userId })
                .groupBy('i.status')
                .getRawMany();

            const totalInvoice = invoices.reduce((s: number, i: any) => s + Number(i.total), 0);
            const paidInvoice = invoices.find((i: any) => i.status === 'paid');
            const overdueInvoice = invoices.find((i: any) => i.status === 'overdue');

            res.json({
                data: {
                    monthlyExpenses: Number(monthlyExpense?.total || 0),
                    totalInvoiced: totalInvoice,
                    paidInvoices: Number(paidInvoice?.total || 0),
                    overdueInvoices: Number(overdueInvoice?.total || 0),
                    invoiceCounts: invoices,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
