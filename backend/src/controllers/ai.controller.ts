import OpenAI from 'openai';
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { Invoice } from '../models/Invoice';
import { AuthRequest } from '../middleware/auth';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// System prompt that defines the AI's financial assistant role
const SYSTEM_PROMPT = `You are PocketAI, an AI financial assistant for PocketAccountant — a South African accounting app.

Your role: Help users understand their finances by answering questions about their data. You can query their expenses, budgets, invoices, and provide financial insights.

Rules:
- Always respond in plain English (no markdown tables)
- Be concise but helpful
- Use South African financial context (SARS, VAT at 15%, ZAR currency)
- If you don't have enough data to answer confidently, say so
- Never fabricate numbers — only use data from the queries
- Reference SARS tax rules when relevant (R4.58/km mileage rate, ITR12 due 31 Oct, etc.)
- Keep responses friendly but professional

When asked about spending, budgets, or finances, query their data and provide specific figures.`;

export class AIChatController {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || 'sk-dcb60d14465447d5baa346745ecf0a52',
            baseURL: process.env.AI_BASE_URL || 'https://api.deepseek.com',
        });
    }

    // Query the user's financial data
    private async queryUserData(userId: number, question: string) {
        const expenseRepo = AppDataSource.getRepository(Expense);
        const budgetRepo = AppDataSource.getRepository(Budget);
        const invoiceRepo = AppDataSource.getRepository(Invoice);

        // Determine what data to fetch based on the question
        const needsExpenses = /spend|expense|cost|paid|transaction|categor|month|recent/i.test(question);
        const needsBudgets = /budget|limit|allocat/i.test(question);
        const needsInvoices = /invoice|bill|client|revenue|income|unpaid|overdue/i.test(question);

        const context: string[] = [];

        if (needsExpenses) {
            const totalExpenses = await expenseRepo
                .createQueryBuilder('e')
                .where('e.userId = :userId', { userId })
                .select('COALESCE(SUM(e.amount), 0)', 'total')
                .getRawOne();

            const byCategory = await expenseRepo
                .createQueryBuilder('e')
                .where('e.userId = :userId', { userId })
                .select('e.category', 'category')
                .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
                .addSelect('COUNT(e.id)', 'count')
                .groupBy('e.category')
                .orderBy('total', 'DESC')
                .getRawMany();

            const recentExpenses = await expenseRepo.find({
                where: { userId: userId as any },
                order: { date: 'DESC' },
                take: 10,
            });

            const thisMonth = new Date();
            thisMonth.setDate(1);
            const monthlyTotal = await expenseRepo
                .createQueryBuilder('e')
                .where('e.userId = :userId', { userId })
                .andWhere('e.date >= :start', { start: thisMonth.toISOString().split('T')[0] })
                .select('COALESCE(SUM(e.amount), 0)', 'total')
                .getRawOne();

            context.push(`Total expenses: R${Number(totalExpenses.total).toFixed(2)}`);
            context.push(`This month's spending: R${Number(monthlyTotal.total).toFixed(2)}`);
            if (byCategory.length > 0) {
                const topCategories = byCategory.slice(0, 5)
                    .map((c: any) => `${c.category}: R${Number(c.total).toFixed(2)} (${c.count} transactions)`)
                    .join(' | ');
                context.push(`Top categories: ${topCategories}`);
            }
            if (recentExpenses.length > 0) {
                const recent = recentExpenses
                    .map((e: any) => `${e.date}: R${Number(e.amount).toFixed(2)} on ${e.description || 'untitled'} (${e.category})`)
                    .join('\n');
                context.push(`\nRecent transactions:\n${recent}`);
            }
        }

        if (needsBudgets) {
            const budgets = await budgetRepo.find({
                where: { userId: userId as any },
            });

            if (budgets.length > 0) {
                context.push(`\nBudgets: ${budgets.map(b => `${b.categoryId}: R${Number(b.amount).toFixed(2)}/${b.period}`).join(' | ')}`);
            } else {
                context.push('\nNo budgets set yet.');
            }
        }

        if (needsInvoices) {
            const invoices = await invoiceRepo.find({
                where: { userId: userId as any },
            });

            const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total), 0);
            const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
            const unpaid = invoices.filter(i => ['draft', 'sent', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.total), 0);

            context.push(`\nInvoices: ${invoices.length} total | R${totalInvoiced.toFixed(2)} invoiced | R${paid.toFixed(2)} paid | R${unpaid.toFixed(2)} outstanding`);
            const overdue = invoices.filter(i => i.status === 'overdue');
            if (overdue.length > 0) {
                context.push(`⚠️ ${overdue.length} overdue invoices totaling R${overdue.reduce((s, i) => s + Number(i.total), 0).toFixed(2)}`);
            }
        }

        return context.join('\n');
    }

    // Chat endpoint
    async chat(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { message, history } = req.body;

            if (!message || typeof message !== 'string') {
                return res.status(400).json({ error: 'Message is required' });
            }

            // Get relevant data
            const userData = await this.queryUserData(userId, message);

            // Build conversation
            const messages: Message[] = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'system', content: `Here is the user's financial data:\n${userData || 'No financial data found for this user.'}` },
            ];

            // Add chat history (last 10 messages)
            if (history && Array.isArray(history)) {
                for (const msg of history.slice(-10)) {
                    messages.push({ role: msg.role || 'user', content: msg.content });
                }
            }

            // Add current message
            messages.push({ role: 'user', content: message });

            // Call AI
            const completion = await this.openai.chat.completions.create({
                model: process.env.AI_MODEL || 'deepseek-chat',
                messages: messages as any,
                temperature: 0.3,
                max_tokens: 1024,
            });

            const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process that.';

            res.json({
                data: {
                    reply,
                    usage: completion.usage,
                },
            });

        } catch (error: any) {
            console.error('AI Chat error:', error.message);
            res.status(500).json({ error: error.message || 'Failed to process AI request' });
        }
    }

    // Quick summary (used for dashboard widget)
    async summary(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const data = await this.queryUserData(userId, 'summary');

            const completion = await this.openai.chat.completions.create({
                model: process.env.AI_MODEL || 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are PocketAI. Give a 2-3 sentence financial summary based on this data. Keep it friendly and actionable.' },
                    { role: 'system', content: data },
                    { role: 'user', content: 'Give me a quick financial summary' },
                ],
                temperature: 0.2,
                max_tokens: 256,
            });

            res.json({
                data: {
                    summary: completion.choices[0]?.message?.content || 'No summary available.',
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
