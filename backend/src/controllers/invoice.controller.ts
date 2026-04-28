import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Invoice } from '../models/Invoice';
import { InvoiceItem } from '../models/InvoiceItem';
import { Client } from '../models/Client';
import { AuthRequest } from '../middleware/auth';

const invoiceRepository = () => AppDataSource.getRepository(Invoice);
const itemRepository = () => AppDataSource.getRepository(InvoiceItem);
const clientRepository = () => AppDataSource.getRepository(Client);

export class InvoiceController {
    // Generate next invoice number
    private async generateInvoiceNumber(userId: number): Promise<string> {
        const result = await invoiceRepository()
            .createQueryBuilder('invoice')
            .where('invoice.userId = :userId', { userId })
            .orderBy('invoice.id', 'DESC')
            .getOne();

        const nextNum = (result?.id || 0) + 1;
        const year = new Date().getFullYear();
        return `INV-${year}-${String(nextNum).padStart(4, '0')}`;
    }

    // List all invoices for user
    async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const status = req.query.status as string;

            const query = invoiceRepository()
                .createQueryBuilder('invoice')
                .leftJoinAndSelect('invoice.client', 'client')
                .where('invoice.userId = :userId', { userId })
                .orderBy('invoice.createdAt', 'DESC');

            if (status) {
                query.andWhere('invoice.status = :status', { status });
            }

            const [invoices, total] = await query
                .skip((page - 1) * limit)
                .take(limit)
                .getManyAndCount();

            res.json({
                data: invoices,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get single invoice with items
    async getById(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const invoice = await invoiceRepository().findOne({
                where: { id: parseInt(req.params.id), userId },
                relations: ['client', 'items'],
            });

            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            res.json({ data: invoice });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Create invoice with items
    async create(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { clientId, issueDate, dueDate, notes, terms, items, vatRegistered } = req.body;

            if (!clientId || !issueDate || !dueDate || !items || items.length === 0) {
                return res.status(400).json({ error: 'Client, issue date, due date, and at least one item are required' });
            }

            // Verify client belongs to user
            const client = await clientRepository().findOne({
                where: { id: clientId, userId },
            });
            if (!client) {
                return res.status(400).json({ error: 'Invalid client' });
            }

            // Calculate totals
            let subtotal = 0;
            const invoiceItems: Partial<InvoiceItem>[] = items.map((item: any) => {
                const quantity = item.quantity || 1;
                const unitPrice = parseFloat(item.unitPrice) || 0;
                const vatRate = vatRegistered ? (parseFloat(item.vatRate) || 15) : 0;
                const lineTotal = quantity * unitPrice;
                const vatAmount = lineTotal * (vatRate / 100);
                subtotal += lineTotal;

                return {
                    description: item.description,
                    quantity,
                    unitPrice,
                    vatRate,
                    lineTotal,
                };
            });

            const vatAmount = vatRegistered ? subtotal * 0.15 : 0; // SA VAT is 15%
            const total = subtotal + vatAmount;

            // Generate invoice number
            const invoiceNumber = await this.generateInvoiceNumber(userId);

            const invoice = invoiceRepository().create({
                userId,
                clientId,
                invoiceNumber,
                issueDate,
                dueDate,
                subtotal,
                vatAmount,
                total,
                notes,
                terms,
                vatRegistered: vatRegistered || false,
                status: 'draft',
                currency: 'ZAR',
                paidAmount: 0,
            });

            const saved = await invoiceRepository().save(invoice);

            // Save items with invoice ID
            for (const item of invoiceItems) {
                const invoiceItem = itemRepository().create({
                    ...item,
                    invoiceId: saved.id,
                });
                await itemRepository().save(invoiceItem);
            }

            // Return with items
            const result = await invoiceRepository().findOne({
                where: { id: saved.id },
                relations: ['client', 'items'],
            });

            res.status(201).json({ data: result });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update invoice status
    async updateStatus(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { status } = req.body;
            const validStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            }

            const invoice = await invoiceRepository().findOne({
                where: { id: parseInt(req.params.id), userId },
            });

            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            invoice.status = status;
            if (status === 'sent') invoice.sentAt = new Date();
            if (status === 'paid') invoice.paidAt = new Date();

            await invoiceRepository().save(invoice);

            res.json({ data: invoice });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Mark payment received
    async recordPayment(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { amount } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Valid payment amount required' });
            }

            const invoice = await invoiceRepository().findOne({
                where: { id: parseInt(req.params.id), userId },
            });

            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            const newPaid = parseFloat(invoice.paidAmount.toString()) + parseFloat(amount);
            invoice.paidAmount = newPaid;

            if (newPaid >= parseFloat(invoice.total.toString())) {
                invoice.status = 'paid';
                invoice.paidAt = new Date();
            } else {
                invoice.status = 'partial';
            }

            await invoiceRepository().save(invoice);

            res.json({ data: invoice });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete invoice
    async delete(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const invoice = await invoiceRepository().findOne({
                where: { id: parseInt(req.params.id), userId },
            });

            if (!invoice) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            // Delete items first, then invoice
            await itemRepository().delete({ invoiceId: invoice.id });
            await invoiceRepository().remove(invoice);

            res.json({ message: 'Invoice deleted' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
