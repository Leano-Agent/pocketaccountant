import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { MileageTrip, calculateMileageClaim } from '../models/MileageTrip';
import { AuthRequest } from '../middleware/auth';

export class MileageController {
    // List trips
    async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const tripType = req.query.tripType as string;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const query = AppDataSource.getRepository(MileageTrip)
                .createQueryBuilder('trip')
                .where('trip.userId = :userId', { userId })
                .orderBy('trip.tripDate', 'DESC');

            if (tripType) query.andWhere('trip.tripType = :tripType', { tripType });
            if (startDate) query.andWhere('trip.tripDate >= :startDate', { startDate });
            if (endDate) query.andWhere('trip.tripDate <= :endDate', { endDate });

            const [trips, total] = await query
                .skip((page - 1) * limit)
                .take(limit)
                .getManyAndCount();

            const totalBusinessKm = trips
                .filter(t => t.tripType === 'business')
                .reduce((s, t) => s + Number(t.distanceKm), 0);

            const totalClaimable = trips
                .filter(t => t.tripType === 'business')
                .reduce((s, t) => s + Number(t.claimableAmount), 0);

            res.json({
                data: trips,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                summary: {
                    totalBusinessKm: Math.round(totalBusinessKm * 100) / 100,
                    totalClaimable: Math.round(totalClaimable * 100) / 100,
                    totalTrips: trips.length,
                    businessTrips: trips.filter(t => t.tripType === 'business').length,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Create trip
    async create(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const { tripDate, startLocation, endLocation, distanceKm, tripType, businessPurpose, vehicleReg, notes } = req.body;

            if (!tripDate || !distanceKm || distanceKm <= 0) {
                return res.status(400).json({ error: 'Trip date and distance are required' });
            }

            const claim = calculateMileageClaim(parseFloat(distanceKm));

            const trip = AppDataSource.getRepository(MileageTrip).create({
                userId,
                tripDate,
                startLocation: startLocation || '',
                endLocation: endLocation || '',
                distanceKm: parseFloat(distanceKm),
                tripType: tripType || 'personal',
                businessPurpose,
                sarsRate: claim.rate,
                claimableAmount: tripType === 'business' ? claim.claimable : 0,
                vehicleReg,
                notes,
            });

            const saved = await AppDataSource.getRepository(MileageTrip).save(trip);
            res.status(201).json({ data: saved });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update trip
    async update(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const trip = await AppDataSource.getRepository(MileageTrip).findOne({
                where: { id: parseInt(req.params.id as string), userId },
            });

            if (!trip) return res.status(404).json({ error: 'Trip not found' });

            const repo = AppDataSource.getRepository(MileageTrip);
            repo.merge(trip, req.body);

            // Recalculate if distance or type changed
            if (req.body.distanceKm || req.body.tripType) {
                const distance = parseFloat(req.body.distanceKm || trip.distanceKm.toString());
                const isBusiness = (req.body.tripType || trip.tripType) === 'business';
                if (isBusiness) {
                    const claim = calculateMileageClaim(distance);
                    trip.claimableAmount = claim.claimable;
                    trip.sarsRate = claim.rate;
                } else {
                    trip.claimableAmount = 0;
                }
            }

            const saved = await repo.save(trip);
            res.json({ data: saved });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Delete trip
    async delete(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const trip = await AppDataSource.getRepository(MileageTrip).findOne({
                where: { id: parseInt(req.params.id as string), userId },
            });
            if (!trip) return res.status(404).json({ error: 'Trip not found' });

            await AppDataSource.getRepository(MileageTrip).remove(trip);
            res.json({ message: 'Trip deleted' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Export logbook (for CSV/PDF generation on frontend)
    async export(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const startDate = req.query.startDate as string;
            const endDate = req.query.endDate as string;

            const query = AppDataSource.getRepository(MileageTrip)
                .createQueryBuilder('trip')
                .where('trip.userId = :userId', { userId })
                .andWhere('trip.tripType = :type', { type: 'business' })
                .orderBy('trip.tripDate', 'ASC');

            if (startDate) query.andWhere('trip.tripDate >= :startDate', { startDate });
            if (endDate) query.andWhere('trip.tripDate <= :endDate', { endDate });

            const trips = await query.getMany();

            const totalKm = trips.reduce((s, t) => s + Number(t.distanceKm), 0);
            const totalClaim = trips.reduce((s, t) => s + Number(t.claimableAmount), 0);

            res.json({
                data: trips,
                summary: {
                    totalTrips: trips.length,
                    totalBusinessKm: Math.round(totalKm * 100) / 100,
                    totalClaimable: Math.round(totalClaim * 100) / 100,
                    rate: trips[0]?.sarsRate || 4.58,
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get current SARS rate
    async getRate(req: AuthRequest, res: Response) {
        res.json({
            data: {
                standardRate: 4.58,
                taxYear: '2025/2026',
                effectiveFrom: '2025-03-01',
                method: 'Rate per km for business travel (includes fuel, maintenance, insurance)',
            },
        });
    }
}
