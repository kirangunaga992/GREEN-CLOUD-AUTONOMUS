#!/bin/bash

# ============================================
# GreenOps Test Runner
# Runs all tests and generates report
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     GreenOps Autonomous - Test Suite         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# 1. Check services are running
echo -e "${YELLOW}[1/4] Checking services...${NC}"
if docker compose ps | grep -q "healthy"; then
    echo -e "${GREEN}✅ Docker services running${NC}"
else
    echo -e "${RED}❌ Services not running${NC}"
    echo "Run: docker compose up -d"
    exit 1
fi
echo ""

# 2. Backend Python tests
echo -e "${YELLOW}[2/4] Running Backend Tests (pytest)...${NC}"
docker exec greenops-autonomous-greenops-api-1 python -m pytest /app/tests/ -v 2>/dev/null || {
    echo "Copying tests to container..."
    docker cp backend/tests greenops-autonomous-greenops-api-1:/app/
    docker exec greenops-autonomous-greenops-api-1 pip install pytest 2>/dev/null || true
    docker exec greenops-autonomous-greenops-api-1 python -m pytest /app/tests/ -v
}
echo ""

# 3. API integration tests
echo -e "${YELLOW}[3/4] Running API Integration Tests...${NC}"
if command -v node &> /dev/null; then
    cd greenops-dashboard
    node tests/test-api.js
    cd ..
else
    echo -e "${YELLOW}⚠️  Node.js not found, skipping API tests${NC}"
fi
echo ""

# 4. Test coverage report
echo -e "${YELLOW}[4/4] Generating Coverage Report...${NC}"
docker exec greenops-autonomous-greenops-api-1 python -m pytest /app/tests/ --tb=short 2>/dev/null | tail -20 || echo "Coverage report skipped"
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ ALL TESTS COMPLETED             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
