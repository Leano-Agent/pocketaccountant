# PocketAccountant - Deployment Guide

## Project Overview
PocketAccountant is a personal finance management application built with African users in mind. It features multi-currency support, offline capabilities, and mobile optimization.

## Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + TypeORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT-based

## Prerequisites
- Node.js 18+ and npm
- Git
- For production: PostgreSQL database

## Local Development Setup

### 1. Clone and Setup
```bash
git clone <repository-url>
cd pocketaccountant
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DB_DATABASE=pocketaccountant
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=PocketAccountant
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development
```

## Production Deployment

### Option 1: Docker Deployment

#### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pocketaccountant
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DB_TYPE: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: your-secure-password
      DB_DATABASE: pocketaccountant
      JWT_SECRET: your-production-jwt-secret
      CORS_ORIGIN: https://your-frontend-domain.com
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      REACT_APP_API_URL: https://your-backend-domain.com/api
```

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 2: Manual Deployment

#### Backend Deployment (Vercel/Render.com)
1. Push code to GitHub
2. Connect repository to Vercel/Render
3. Configure environment variables
4. Deploy

#### Frontend Deployment (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables

### Option 3: Railway.app (All-in-one)
1. Connect GitHub repository
2. Railway will detect the project structure
3. Configure environment variables
4. Deploy with one click

## Database Migrations

### Development (SQLite)
```bash
cd backend
npm run migration:generate -- -n InitialMigration
npm run migration:run
```

### Production (PostgreSQL)
```bash
cd backend
# Update data-source.ts to use PostgreSQL
npm run migration:run
```

## Environment Configuration

### Production Backend (.env)
```env
PORT=5000
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=pocketaccountant
JWT_SECRET=generate-a-strong-secret-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
# Add these for enhanced security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Production Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_NAME=PocketAccountant
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
REACT_APP_SENTRY_DSN=your-sentry-dsn  # Optional: for error tracking
```

## SSL/HTTPS Configuration

### Using Let's Encrypt with Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring and Maintenance

### Health Checks
- Backend: `GET /api/health`
- Frontend: Built-in React error boundaries

### Logging
```bash
# Backend logs
cd backend
npm run start 2>&1 | tee app.log

# Using PM2 for process management
pm2 start dist/index.js --name pocketaccountant-backend
pm2 logs pocketaccountant-backend
```

### Backup Strategy
```bash
# Database backup (PostgreSQL)
pg_dump -U postgres pocketaccountant > backup_$(date +%Y%m%d).sql

# Regular backups with cron
0 2 * * * pg_dump -U postgres pocketaccountant > /backups/pocketaccountant_$(date +\%Y\%m\%d).sql
```

## Scaling Considerations

### Horizontal Scaling
1. Use a load balancer (Nginx, HAProxy)
2. Configure database connection pooling
3. Implement Redis for session storage
4. Use CDN for static assets

### Database Optimization
1. Add indexes for frequently queried columns
2. Implement database replication
3. Regular vacuum and analyze (PostgreSQL)

## Security Checklist
- [ ] Use strong JWT secrets
- [ ] Enable CORS only for trusted domains
- [ ] Implement rate limiting
- [ ] Use HTTPS in production
- [ ] Sanitize user inputs
- [ ] Regular dependency updates
- [ ] Database connection SSL/TLS
- [ ] Secure environment variables

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **CORS errors**
   - Verify CORS_ORIGIN matches frontend URL
   - Check for trailing slashes

3. **JWT authentication failing**
   - Verify JWT_SECRET is consistent
   - Check token expiration

4. **Build failures**
   - Clear node_modules and package-lock.json
   - Reinstall dependencies
   - Check Node.js version compatibility

### Debug Mode
```bash
# Backend debug
cd backend
DEBUG=* npm run dev

# Frontend debug
cd frontend
npm start -- --verbose
```

## Support
For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Create GitHub issue with details
4. Contact support team

## Version History
- v1.0.0: Initial release with core features
- Future: PWA enhancements, AI insights, bank integration