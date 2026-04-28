import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Expense } from './Expense';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    name!: string;

    @Column({ select: false })
    password_hash!: string;

    @Column({ length: 3, default: 'ZAR' })
    default_currency!: string;

    @Column({ default: 'ZAR,USD,EUR' })
    preferred_currencies!: string;

    @Column({ nullable: true })
    avatar_url!: string;

    @Column('boolean', { default: false })
    email_verified!: boolean;

    @Column({ nullable: true })
    phone_number!: string;

    @Column('boolean', { default: false })
    phone_verified!: boolean;

    @Column({ nullable: true })
    country!: string;

    @Column({ nullable: true })
    timezone!: string;

    @OneToMany(() => Expense, expense => expense.user)
    expenses!: Expense[];

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}