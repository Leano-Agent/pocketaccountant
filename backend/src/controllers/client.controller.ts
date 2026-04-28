import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Client } from '../models/Client';
import { AuthRequest } from '../middleware/auth';

const clientRepository = () => AppDataSource.getRepository(Client);

export class ClientController {
    async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const clients = await clientRepository().find({
                where: { userId },
                order: { name: 'ASC' },
            });
            res.json({ data: clients });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getById(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const client = await clientRepository().findOne({
                where: { id: parseInt(req.params.id as string), userId },
            });
            if (!client) return res.status(404).json({ error: 'Client not found' });
            res.json({ data: client });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async create(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { name, email, phone, company, address, vatNumber } = req.body;

            if (!name) return res.status(400).json({ error: 'Client name is required' });

            const client = clientRepository().create({
                userId,
                name,
                email,
                phone,
                company,
                address,
                vatNumber,
            });

            const saved = await clientRepository().save(client);
            res.status(201).json({ data: saved });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const client = await clientRepository().findOne({
                where: { id: parseInt(req.params.id as string), userId },
            });
            if (!client) return res.status(404).json({ error: 'Client not found' });

            clientRepository().merge(client, req.body);
            const saved = await clientRepository().save(client);
            res.json({ data: saved });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const client = await clientRepository().findOne({
                where: { id: parseInt(req.params.id as string), userId },
            });
            if (!client) return res.status(404).json({ error: 'Client not found' });

            await clientRepository().remove(client);
            res.json({ message: 'Client deleted' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
