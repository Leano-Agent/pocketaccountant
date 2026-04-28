import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import { expenseRouter } from './routes/expense.routes';
import { budgetRouter } from './routes/budget.routes';
import authRouter from './routes/auth.routes';
import invoiceRouter from './routes/invoice.routes';
import clientRouter from './routes/client.routes';
import reportRouter from './routes/report.routes';
import taxRouter from './routes/tax.routes';
import mileageRouter from './routes/mileage.routes';
import passport from './config/passport';
import oauthRouter from './routes/oauth.routes';
import aiRouter from './routes/ai.routes';
import autoCategoryRouter from './routes/auto-category.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// API Routes
app.use('/api/expenses', expenseRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/auth', authRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/clients', clientRouter);
app.use('/api/reports', reportRouter);
app.use('/api/tax', taxRouter);
app.use('/api/mileage', mileageRouter);
app.use('/api/auth', oauthRouter);
app.use('/api/ai', aiRouter);
app.use('/api/auto-categorize', autoCategoryRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'PocketAccountant API'
    });
});

// Database connection
AppDataSource.initialize()
    .then(() => {
        console.log('Database connected');
        
        const PORT = process.env.PORT || 5000;
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.log('Database connection error: ', error);
    });