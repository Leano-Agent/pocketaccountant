# PocketAccountant

A personal finance management application focused on African user needs and financial inclusion.

## Features

- 📊 Expense tracking and categorization
- 💰 Budget planning and monitoring
- 💵 Income tracking with multiple sources
- 🎯 Financial goals and savings targets
- 📈 Basic investment tracking
- 📱 Mobile-responsive design
- 🌍 Multi-currency support (focus on African currencies)

## Key Principles

- 🔒 Privacy-first design
- 📵 Offline-capable where possible
- 📡 Low data usage for African mobile contexts
- 👥 Clear, accessible financial interface

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Responsive design
- PWA capabilities for offline use

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL database
- TypeORM for database operations

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create .env file:
   ```
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/pocketaccountant
   JWT_SECRET=your_jwt_secret
   ```

4. Run migrations:
   ```bash
   npm run typeorm migration:run
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create .env file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start development server:
   ```bash
   npm start
   ```

## Project Structure

```
pocketaccountant/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── assets/
│   │   └── styles/
│   └── public/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── utils/
│   └── dist/
└── docs/