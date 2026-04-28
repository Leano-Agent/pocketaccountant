import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { Category } from './Category';

@Entity('budgets')
export class Budget {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column('decimal', { precision: 15, scale: 2 })
    amount!: number;

    @Column({ length: 3 })
    currency!: string;

    @Column({ 
        type: 'varchar',
        default: 'monthly'
    })
    period!: string;

    @Column('date')
    start_date!: Date;

    @Column('date', { nullable: true })
    end_date!: Date;

    @Column('boolean', { default: true })
    is_active!: boolean;

    @Column('text', { nullable: true })
    description!: string;

    @ManyToOne(() => Category, category => category.expenses)
    category!: Category;

    @ManyToOne(() => User, user => user.expenses)
    user!: User;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}