import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('mileage_trips')
export class MileageTrip {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'date' })
    tripDate!: string;

    @Column({ nullable: true })
    startLocation!: string;

    @Column({ nullable: true })
    endLocation!: string;

    @Column('decimal', { precision: 8, scale: 2 })
    distanceKm!: number;

    @Column({ default: 'personal' })
    tripType!: 'business' | 'personal';

    @Column({ nullable: true })
    businessPurpose!: string;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    sarsRate!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    claimableAmount!: number;

    @Column({ nullable: true })
    vehicleReg!: string;

    @Column({ type: 'text', nullable: true })
    notes!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// SARS prescribed mileage rates (updated annually)
// For 2026 tax year (Mar 2025 - Feb 2026):
export const SARS_MILEAGE_RATES = {
    // Rate per km for business travel (covers fuel + maintenance)
    standardRate: 4.58, // R4.58/km for 2025/2026 tax year
    // Fixed cost method for employer-provided vehicles
    fixedCostRates: {
        upTo100000: 135000,
        upTo200000: 210000,
        upTo300000: 295000,
        upTo400000: 370000,
        above400000: 420000,
    },
    fixedCostPerKm: 4.18, // For fixed cost calculation
};

export function calculateMileageClaim(distanceKm: number, useFixedCost: boolean = false): {
    rate: number;
    claimable: number;
    method: string;
} {
    const rate = SARS_MILEAGE_RATES.standardRate;
    const claimable = distanceKm * rate;

    return {
        rate,
        claimable: Math.round(claimable * 100) / 100,
        method: useFixedCost ? 'Fixed Cost Method' : 'Standard Rate (Fuel + Maintenance)',
    };
}
