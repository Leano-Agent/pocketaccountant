import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Client } from './Client';
import { InvoiceItem } from './InvoiceItem';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ nullable: true })
    clientId!: number;

    @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'clientId' })
    client!: Client;

    @Column({ unique: true })
    invoiceNumber!: string;

    @Column({ type: 'date' })
    issueDate!: string;

    @Column({ type: 'date' })
    dueDate!: string;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    subtotal!: number;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    vatAmount!: number;

    @Column('decimal', { precision: 12, scale: 2, default: 0 })
    total!: number;

    @Column({ default: 'ZAR' })
    currency!: string;

    @Column({ type: 'text', nullable: true })
    notes!: string;

    @Column({ type: 'text', nullable: true })
    terms!: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    paidAmount!: number;

    @Column({
        type: 'varchar',
        default: 'draft'
    })
    status!: InvoiceStatus;

    @Column({ nullable: true })
    sentAt!: Date;

    @Column({ nullable: true })
    paidAt!: Date;

    @Column({ default: false })
    vatRegistered!: boolean;

    @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
    items!: InvoiceItem[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
