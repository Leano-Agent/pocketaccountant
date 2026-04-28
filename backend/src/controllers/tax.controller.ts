import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { TaxReturn, getSarsDeadlines } from '../models/TaxReturn';
import { AuthRequest } from '../middleware/auth';

export class TaxController {
    // Get personalized tax calendar
    async calendar(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const deadlines = getSarsDeadlines(userId);

            const taxRepo = AppDataSource.getRepository(TaxReturn);
            const returns = await taxRepo.find({
                where: { userId: userId as any },
            });

            // Enrich deadlines with user's filing status
            const enriched = deadlines.map(d => {
                const existingReturn = returns.find(
                    r => r.returnType === d.type && r.taxYear === d.label.split('(')[1]?.trim().replace(')', '')
                );
                const daysRemaining = Math.ceil((d.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return {
                    type: d.type,
                    label: d.label,
                    deadline: d.deadline.toISOString().split('T')[0],
                    description: d.description,
                    daysRemaining,
                    isUrgent: daysRemaining <= 7 && daysRemaining >= 0,
                    isOverdue: daysRemaining < 0,
                    status: existingReturn?.status || 'pending',
                    sarsReference: existingReturn?.sarsReference || null,
                };
            });

            res.json({ data: enriched });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // List user's tax returns
    async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const taxRepo = AppDataSource.getRepository(TaxReturn);
            const returns = await taxRepo.find({
                where: { userId: userId as any },
                order: { deadline: 'ASC' },
            });
            res.json({ data: returns });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Create/initiate a tax return
    async create(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { taxYear, returnType, deadline } = req.body;

            if (!taxYear || !returnType) {
                return res.status(400).json({ error: 'Tax year and return type are required' });
            }

            const taxRepo = AppDataSource.getRepository(TaxReturn);
            const taxReturn = taxRepo.create({
                userId,
                taxYear,
                returnType,
                deadline,
                status: 'preparing',
            });

            const saved = await taxRepo.save(taxReturn);
            res.status(201).json({ data: saved });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update tax return status
    async updateStatus(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { status, sarsReference, amountPaid } = req.body;

            const taxRepo = AppDataSource.getRepository(TaxReturn);
            const taxReturn = await taxRepo.findOne({
                where: { id: parseInt(req.params.id), userId },
            });

            if (!taxReturn) {
                return res.status(404).json({ error: 'Tax return not found' });
            }

            if (status) taxReturn.status = status;
            if (sarsReference) taxReturn.sarsReference = sarsReference;
            if (amountPaid !== undefined) taxReturn.amountPaid = amountPaid;
            if (status === 'filed') taxReturn.filedDate = new Date().toISOString().split('T')[0];

            const saved = await taxRepo.save(taxReturn);
            res.json({ data: saved });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
