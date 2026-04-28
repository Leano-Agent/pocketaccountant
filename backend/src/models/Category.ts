import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Expense } from './Expense';
import { User } from './User';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column()
    name!: string;

    @Column()
    color!: string;

    @Column()
    icon!: string;

    @Column('decimal', { precision: 15, scale: 2, nullable: true })
    budget!: number;

    @Column({ length: 3, default: 'ZAR' })
    currency!: string;

    @Column('text', { nullable: true })
    description!: string;

    @Column('boolean', { default: true })
    is_active!: boolean;

    @Column('int', { default: 0 })
    sort_order!: number;

    @OneToMany(() => Expense, expense => expense.category)
    expenses!: Expense[];

    @ManyToOne(() => User, user => user.expenses)
    user!: User;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}