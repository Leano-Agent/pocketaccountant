import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './Invoice';

@Entity('invoice_items')
export class InvoiceItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    invoiceId!: number;

    @ManyToOne(() => Invoice, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'invoiceId' })
    invoice!: Invoice;

    @Column()
    description!: string;

    @Column({ nullable: true })
    quantity!: number;

    @Column('decimal', { precision: 12, scale: 2 })
    unitPrice!: number;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    vatRate!: number;

    @Column('decimal', { precision: 12, scale: 2 })
    lineTotal!: number;

    @CreateDateColumn()
    createdAt!: Date;
}
