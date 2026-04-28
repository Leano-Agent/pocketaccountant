#!/bin/bash

# PocketAccountant Dependency Installation Script
# Run this script to install dependencies after the fix

echo "=== PocketAccountant Dependency Installation ==="
echo ""

# Frontend installation
echo "1. Installing frontend dependencies..."
cd frontend
if command -v yarn &> /dev/null; then
    echo "   Using yarn..."
    yarn install --ignore-engines
else
    echo "   Using npm..."
    npm install --no-audit
fi

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "   ✓ Frontend dependencies installed successfully"
    
    # Test build
    echo "   Testing build..."
    npm run build 2>&1 | tail -20
    if [ $? -eq 0 ]; then
        echo "   ✓ Build successful"
    else
        echo "   ✗ Build failed - check errors above"
    fi
else
    echo "   ✗ Frontend installation failed"
fi
cd ..

echo ""
echo "2. Installing backend dependencies..."
cd backend
npm install --no-audit
if [ $? -eq 0 ]; then
    echo "   ✓ Backend dependencies installed successfully"
else
    echo "   ✗ Backend installation failed"
fi
cd ..

echo ""
echo "=== Installation Complete ==="
echo ""
echo "To start the development servers:"
echo "1. Frontend: cd frontend && npm start"
echo "2. Backend: cd backend && npm run dev"
echo ""
echo "For production build: cd frontend && npm run build"