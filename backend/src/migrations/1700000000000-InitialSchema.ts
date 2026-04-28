import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1700000000000 implements MigrationInterface {
    name = 'InitialSchema1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                default_currency CHAR(3) DEFAULT 'ZAR',
                preferred_currencies TEXT[] DEFAULT ARRAY['ZAR', 'USD', 'EUR'],
                avatar_url TEXT,
                email_verified BOOLEAN DEFAULT false,
                phone_number VARCHAR(20),
                phone_verified BOOLEAN DEFAULT false,
                country VARCHAR(100),
                timezone VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create categories table
        await queryRunner.query(`
            CREATE TABLE categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                icon VARCHAR(50),
                color VARCHAR(7),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create expenses table
        await queryRunner.query(`
            CREATE TABLE expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                amount DECIMAL(15,2) NOT NULL,
                currency CHAR(3) NOT NULL,
                description TEXT NOT NULL,
                date DATE NOT NULL,
                category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                is_recurring BOOLEAN DEFAULT false,
                recurrence_pattern VARCHAR(50),
                receipt_url TEXT,
                location VARCHAR(255),
                tags TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create budgets table
        await queryRunner.query(`
            CREATE TABLE budgets (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                currency CHAR(3) NOT NULL,
                period VARCHAR(20) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX idx_expenses_user_id ON expenses(user_id)`);
        await queryRunner.query(`CREATE INDEX idx_expenses_date ON expenses(date)`);
        await queryRunner.query(`CREATE INDEX idx_categories_user_id ON categories(user_id)`);
        await queryRunner.query(`CREATE INDEX idx_budgets_user_id ON budgets(user_id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS budgets`);
        await queryRunner.query(`DROP TABLE IF EXISTS expenses`);
        await queryRunner.query(`DROP TABLE IF EXISTS categories`);
        await queryRunner.query(`DROP TABLE IF EXISTS users`);
    }
}