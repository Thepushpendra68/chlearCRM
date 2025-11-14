#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 WhatsApp Integration - Test Verification"
echo "=========================================="
echo ""

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js: $NODE_VERSION"
if [[ "${NODE_VERSION:1:2}" -lt "18" ]]; then
    echo -e "${RED}❌ Node.js version must be >= 18.0.0${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version OK${NC}"
echo ""

# Backend Tests
echo "🔧 Running Backend Tests..."
echo "----------------------------"
cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

echo "Running backend tests..."
npm test
BACKEND_EXIT=$?

cd ..

if [ $BACKEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Backend tests passed${NC}"
else
    echo -e "${RED}❌ Backend tests failed${NC}"
fi
echo ""

# Frontend Tests
echo "⚛️  Running Frontend Tests..."
echo "----------------------------"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "Running frontend tests..."
npm run test:run
FRONTEND_EXIT=$?

cd ..

if [ $FRONTEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
else
    echo -e "${RED}❌ Frontend tests failed${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="

if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    echo ""
    echo "🎉 WhatsApp integration is working correctly!"
    echo ""
    echo "Next steps:"
    echo "1. Configure webhook in Meta dashboard"
    echo "2. Test with real WhatsApp messages"
    echo "3. Deploy to production"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please fix the failing tests before deploying."
    echo "See TEST_GUIDE.md for troubleshooting help."
    exit 1
fi

