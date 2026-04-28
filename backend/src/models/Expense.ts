import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { Category } from './Category';

@Entity('expenses')
export class Expense {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column('decimal', { precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column('text')
    description!: string;

    @Column('date')
    date!: Date;

    @ManyToOne(() => Category, category => category.expenses)
    category!: Category;

    @ManyToOne(() => User, user => user.expenses)
    user!: User;

    @Column('boolean', { default: false })
    is_recurring!: boolean;

    @Column({ nullable: true })
    recurrence_pattern!: string;

    @Column({ nullable: true })
    receipt_url!: string;

    @Column({ nullable: true })
    location!: string;

    @Column('text', { nullable: true })
    tags!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}