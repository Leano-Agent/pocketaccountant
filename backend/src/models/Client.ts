import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column()
    name!: string;

    @Column({ nullable: true })
    email!: string;

    @Column({ nullable: true })
    phone!: string;

    @Column({ nullable: true })
    company!: string;

    @Column({ nullable: true })
    address!: string;

    @Column({ nullable: true })
    vatNumber!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
