import { DataSource } from 'typeorm';
import { Expense } from './models/Expense';
import { User } from './models/User';
import { Category } from './models/Category';
import { Budget } from './models/Budget';
import { Invoice } from './models/Invoice';
import { InvoiceItem } from './models/InvoiceItem';
import { Client } from './models/Client';
import { TaxReturn } from './models/TaxReturn';
import { MileageTrip } from './models/MileageTrip';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
    isProduction && process.env.DATABASE_URL
        ? {
              type: 'postgres',
              url: process.env.DATABASE_URL,
              synchronize: true,
              ssl: { rejectUnauthorized: false },
              entities: [Expense, User, Category, Budget, Invoice, InvoiceItem, Client, TaxReturn, MileageTrip],
              subscribers: [],
          }
        : {
              type: 'sqlite',
              database: process.env.DB_DATABASE || './database.sqlite',
              synchronize: true,
              logging: process.env.NODE_ENV === 'development',
              entities: [Expense, User, Category, Budget, Invoice, InvoiceItem, Client, TaxReturn, MileageTrip],
              subscribers: [],
          }
);
