import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export type TaxType = 'ITR12' | 'VAT201' | 'EMP501' | 'IRP6';
export type FilingStatus = 'pending' | 'preparing' | 'ready' | 'filed' | 'overdue' | 'completed';

@Entity('tax_returns')
export class TaxReturn {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    taxYear!: string; // e.g. "2026"

    @Column()
    returnType!: TaxType;

    @Column({ default: 'pending' })
    status!: FilingStatus;

    @Column({ type: 'date', nullable: true })
    deadline!: string;

    @Column({ type: 'date', nullable: true })
    filedDate!: string;

    @Column({ type: 'text', nullable: true })
    sarsReference!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    estimatedLiability!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    amountPaid!: number;

    @Column({ nullable: true })
    notes!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// SARS Deadline Engine
export const SARS_DEADLINES = {
    ITR12: { description: 'Individual Tax Return (ITR12)', monthsFromYearEnd: 10 }, // due Oct after Feb year-end
    VAT201: { description: 'VAT Return (VAT 201)', monthsFromYearEnd: 0 }, // monthly/bi-monthly
    EMP501: { description: 'Employer Reconciliation (EMP501)', monthsFromYearEnd: 0 }, // bi-annual
    IRP6: { description: 'Provisional Tax (IRP6)', monthsFromYearEnd: 0 }, // bi-annual
};

export function getSarsDeadlines(userId: number): Array<{
    type: TaxType;
    label: string;
    deadline: Date;
    description: string;
}> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const deadlines: Array<{ type: TaxType; label: string; deadline: Date; description: string }> = [];

    // ITR12 — due 31 October each year
    const itr12Deadline = new Date(currentYear, 9, 31); // Oct 31
    if (itr12Deadline < now) {
        // Next year if past
        deadlines.push({
            type: 'ITR12',
            label: `ITR12 (Year ${currentYear - 1})`,
            deadline: new Date(currentYear + 1, 9, 31),
            description: 'Individual Income Tax Return',
        });
    } else {
        deadlines.push({
            type: 'ITR12',
            label: `ITR12 (Year ${currentYear - 1})`,
            deadline: itr12Deadline,
            description: 'Individual Income Tax Return',
        });
    }

    // VAT 201 — 25th of every month
    for (let i = 0; i < 3; i++) {
        const vatMonth = now.getMonth() + i;
        const vatYear = now.getFullYear() + Math.floor(vatMonth / 12);
        const m = vatMonth % 12;
        deadlines.push({
            type: 'VAT201',
            label: `VAT 201 (${new Date(vatYear, m).toLocaleDateString('en-ZA', { month: 'long' })})`,
            deadline: new Date(vatYear, m, 25),
            description: 'Monthly VAT Return',
        });
    }

    // EMP501 — 31 May and 31 October
    const empMay = new Date(currentYear, 4, 31);
    const empOct = new Date(currentYear, 9, 31);
    if (empMay > now) {
        deadlines.push({
            type: 'EMP501',
            label: `EMP501 (First Half ${currentYear})`,
            deadline: empMay,
            description: 'Employer PAYE/UIF/SDL Reconciliation',
        });
    }
    if (empOct > now || empMay > now) {
        const nextEmp = empOct > now ? empOct : new Date(currentYear + 1, 4, 31);
        deadlines.push({
            type: 'EMP501',
            label: `EMP501 (${empOct > now ? 'Second Half' : 'First Half'} ${nextEmp.getFullYear()})`,
            deadline: nextEmp,
            description: 'Employer PAYE/UIF/SDL Reconciliation',
        });
    }

    // IRP6 — 31 August and 28/29 February
    const irpAug = new Date(currentYear, 7, 31);
    const irpFeb = new Date(currentYear + 1, 1, currentYear % 4 === 0 ? 29 : 28);
    if (irpAug > now) {
        deadlines.push({
            type: 'IRP6',
            label: `IRP6 (First Period ${currentYear})`,
            deadline: irpAug,
            description: 'First Provisional Tax Payment',
        });
    }
    if (irpFeb > now) {
        deadlines.push({
            type: 'IRP6',
            label: `IRP6 (Second Period ${currentYear})`,
            deadline: irpFeb,
            description: 'Second Provisional Tax Payment',
        });
    }

    return deadlines.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}
