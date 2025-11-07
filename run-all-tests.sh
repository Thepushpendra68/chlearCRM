#!/bin/bash

# Account Management Module - Test Runner
# This script runs all tests for the Account Management module

echo "🧪 Running Account Management Module Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Tests
echo -e "${YELLOW}📦 Running Backend Tests...${NC}"
echo ""

cd backend
if npm test -- --testPathPattern="account" --passWithNoTests; then
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
else
    echo -e "${RED}❌ Backend tests failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🎨 Running Frontend Tests...${NC}"
echo ""

cd ../frontend
if npm test -- --run --reporter=verbose Account; then
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
else
    echo -e "${RED}❌ Frontend tests failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests completed!${NC}"

