# PocketAccountant Frontend

A React-based frontend for the PocketAccountant personal finance management application, designed specifically for African users with features like multi-currency support, offline capability, and low data usage.

## Features

### 🎯 African-Focused Design
- **Multi-currency support**: ZAR, NGN, KES, GHS, EGP, USD, EUR
- **Offline-first architecture**: Works without internet connection
- **Low data usage**: Optimized for African mobile networks
- **Mobile-responsive**: Works on all device sizes

### 💰 Core Features
- **Expense Tracking**: Add, edit, delete, and categorize expenses
- **Category Management**: Customizable expense categories
- **Budget Insights**: Spending analysis and recommendations
- **Reports & Analytics**: Visualize spending patterns
- **Data Export**: Export expenses in CSV/JSON format

### 📱 Technical Features
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management
- **Service Worker** for offline support
- **Local Storage** for data persistence

## Project Structure

```
frontend/
├── public/                 # Static files
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts for state management
│   ├── pages/            # Page components
│   ├── services/         # API and service layer
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main App component
│   └── index.tsx         # Entry point
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend server running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Start the development server:
```bash
npm start
# or
yarn start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `build/` directory.

## Key Components

### 1. Layout Component
Responsive layout with mobile navigation and desktop sidebar.

### 2. Expense Context
Manages expense state with offline support and sync capabilities.

### 3. Currency Context
Handles multi-currency conversions and exchange rates.

### 4. Offline Context
Manages offline state and sync queue.

### 5. API Service
Handles communication with backend with offline fallback.

## Pages

### Dashboard (`/`)
Overview of spending, recent expenses, and quick stats.

### Expenses (`/expenses`)
List, filter, and manage all expenses.

### Add Expense (`/add-expense`)
Form to add new expenses with receipt upload.

### Categories (`/categories`)
Manage expense categories and view category breakdown.

### Reports (`/reports`)
Analytics and insights into spending patterns.

### Settings (`/settings`)
App preferences and data management.

## Offline Support

The application uses a sophisticated offline-first approach:

1. **Local Storage**: All data is cached locally
2. **Sync Queue**: Operations are queued when offline
3. **Auto-sync**: Automatically syncs when back online
4. **Conflict Resolution**: Handles sync conflicts gracefully

## Design Principles

### Mobile-First
- Responsive design that works on all screen sizes
- Touch-friendly interfaces
- Optimized for mobile data networks

### African Context
- Support for African currencies
- Consideration for intermittent connectivity
- Low bandwidth optimization
- Cultural relevance in UI/UX

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

## Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=PocketAccountant
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

## Development

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries

### Testing
```bash
npm test
# or
yarn test
```

### Linting
```bash
npm run lint
# or
yarn lint
```

## Deployment

The application can be deployed to any static hosting service:

1. **Netlify**: Automatic deployment from Git
2. **Vercel**: Optimized for React applications
3. **AWS S3**: Static website hosting
4. **GitHub Pages**: Free hosting for open source projects

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

Built with ❤️ for African users by the PocketAccountant team.