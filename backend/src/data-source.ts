import { DataSource } from 'typeorm';
import { Expense } from './models/Expense';
import { User } from './models/User';
import { Category } from './models/Category';
import { Budget } from './models/Budget';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: process.env.DB_DATABASE || 'database.sqlite',
    synchronize: true, // Always synchronize for development
    logging: process.env.NODE_ENV === 'development',
    entities: [Expense, User, Category, Budget],
    migrations: ['src/migrations/*.ts'],
    subscribers: [],
});