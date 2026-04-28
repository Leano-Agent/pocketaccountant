# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Copy SQLite database (if exists)
COPY pocketaccountant ./pocketaccountant

# Create necessary directories
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"]