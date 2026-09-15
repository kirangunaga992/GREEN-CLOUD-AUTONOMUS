#!/bin/bash

# ============================================
# GreenOps Autonomous - Auto Installer
# 100% FREE - Enterprise-Grade Cloud Monitoring
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Banner
echo ""
echo -e "${GREEN}"
echo "  ╔═══════════════════════════════════════════════╗"
echo "  ║                                               ║"
echo "  ║       🌿  GREENOPS AUTONOMOUS INSTALLER      ║"
echo "  ║                                               ║"
echo "  ║   Sustainable Cloud Monitoring Platform      ║"
echo "  ║   Save 60% cost, 99% carbon emissions        ║"
echo "  ║                                               ║"
echo "  ╚═══════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check OS
echo -e "${BLUE}➜${NC} Checking system requirements..."

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo -e "${GREEN}✓${NC} Linux detected"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo -e "${GREEN}✓${NC} macOS detected"
else
    echo -e "${RED}✗${NC} Unsupported OS: $OSTYPE"
    echo "  Supported: Linux, macOS"
    exit 1
fi

# Check RAM
if [[ "$OS" == "linux" ]]; then
    TOTAL_RAM_MB=$(free -m | awk 'NR==2 {print $2}')
    if [[ $TOTAL_RAM_MB -lt 2048 ]]; then
        echo -e "${YELLOW}⚠${NC}  Warning: Only ${TOTAL_RAM_MB}MB RAM (recommended: 4GB+)"
    else
        echo -e "${GREEN}✓${NC} RAM: ${TOTAL_RAM_MB}MB"
    fi
fi

# Check disk space
DISK_FREE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [[ $DISK_FREE -lt 10 ]]; then
    echo -e "${RED}✗${NC} Not enough disk space (${DISK_FREE}GB free, need 10GB+)"
    exit 1
fi
echo -e "${GREEN}✓${NC} Disk space: ${DISK_FREE}GB free"

echo ""
echo -e "${BLUE}➜${NC} Installing dependencies..."

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Docker not found. Installing..."
    
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh
        sudo usermod -aG docker $USER
        echo -e "${GREEN}✓${NC} Docker installed"
        echo -e "${YELLOW}⚠${NC}  Please logout and login again for Docker permissions"
    else
        echo -e "${RED}✗${NC} Please install Docker Desktop from https://docker.com"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Docker already installed"
fi

# Install Docker Compose if not present
if ! docker compose version &> /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Installing Docker Compose plugin..."
    if [[ "$OS" == "linux" ]]; then
        sudo apt-get update
        sudo apt-get install -y docker-compose-plugin
    fi
    echo -e "${GREEN}✓${NC} Docker Compose installed"
else
    echo -e "${GREEN}✓${NC} Docker Compose already installed"
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Installing Git..."
    if [[ "$OS" == "linux" ]]; then
        sudo apt-get install -y git
    fi
    echo -e "${GREEN}✓${NC} Git installed"
else
    echo -e "${GREEN}✓${NC} Git already installed"
fi

echo ""
echo -e "${BLUE}➜${NC} Downloading GreenOps..."

# Clone or update repo
if [[ -d "greenops-autonomous" ]]; then
    echo -e "${YELLOW}⚠${NC}  greenops-autonomous folder exists"
    read -p "  Update to latest version? (y/n): " UPDATE
    if [[ "$UPDATE" == "y" ]]; then
        cd greenops-autonomous
        git pull
        cd ..
    fi
else
    git clone https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS.git greenops-autonomous
fi

cd greenops-autonomous

echo -e "${GREEN}✓${NC} GreenOps downloaded"

# Configuration wizard
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Configuration Wizard${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# MongoDB configuration
echo "MongoDB Configuration:"
echo "  1) Use MongoDB Atlas (recommended - free cloud DB)"
echo "  2) Install local MongoDB"
read -p "Choose (1 or 2): " MONGO_CHOICE

if [[ "$MONGO_CHOICE" == "1" ]]; then
    echo ""
    echo "  Steps to get MongoDB Atlas URI:"
    echo "  1. Sign up: https://www.mongodb.com/cloud/atlas/register"
    echo "  2. Create free M0 cluster"
    echo "  3. Get connection string"
    echo ""
    read -p "Paste your MongoDB URI: " MONGO_URI
    MONGO_URI=${MONGO_URI:-"mongodb://mongodb:27017"}
else
    MONGO_URI="mongodb://mongodb:27017"
    echo -e "${GREEN}✓${NC} Using local MongoDB"
fi

# Company info
echo ""
read -p "Company Name (for dashboard branding): " COMPANY_NAME
COMPANY_NAME=${COMPANY_NAME:-"MyCompany"}

read -p "Admin Email: " ADMIN_EMAIL

# Ports
echo ""
echo "Port Configuration (press Enter for defaults):"
read -p "Dashboard port (default: 3000): " DASH_PORT
DASH_PORT=${DASH_PORT:-3000}

read -p "Portal port (default: 5001): " PORTAL_PORT
PORTAL_PORT=${PORTAL_PORT:-5001}

read -p "API port (default: 8000): " API_PORT
API_PORT=${API_PORT:-8000}

# Create .env file
cat > .env << ENVEOF
COMPANY_NAME=$COMPANY_NAME
ADMIN_EMAIL=$ADMIN_EMAIL
MONGO_URI=$MONGO_URI
DASH_PORT=$DASH_PORT
PORTAL_PORT=$PORTAL_PORT
API_PORT=$API_PORT
ENVEOF

echo ""
echo -e "${GREEN}✓${NC} Configuration saved to .env"

# Build & Start
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Starting GreenOps Services${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}➜${NC} Building Docker images (this takes 5-10 min)..."
docker compose build

echo ""
echo -e "${BLUE}➜${NC} Starting services..."
docker compose up -d

echo ""
echo -e "${BLUE}➜${NC} Waiting for services to be healthy (30s)..."
sleep 30

# Get server IP
if [[ "$OS" == "linux" ]]; then
    SERVER_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OS" == "macos" ]]; then
    SERVER_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")
fi

# Check health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$API_PORT/health 2>/dev/null || echo "000")

echo ""
if [[ "$API_HEALTH" == "200" ]]; then
    echo -e "${GREEN}"
    echo "  ╔═══════════════════════════════════════════════════╗"
    echo "  ║                                                   ║"
    echo "  ║          ✅  INSTALLATION SUCCESSFUL!            ║"
    echo "  ║                                                   ║"
    echo "  ╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${GREEN}Access URLs:${NC}"
    echo -e "  🎛️  Admin Dashboard:  ${BLUE}http://$SERVER_IP:$DASH_PORT${NC}"
    echo -e "  🚪 User Portal:      ${BLUE}http://$SERVER_IP:$PORTAL_PORT${NC}"
    echo -e "  🔌 API Endpoint:     ${BLUE}http://$SERVER_IP:$API_PORT${NC}"
    echo ""
    echo -e "${YELLOW}📚 Next Steps:${NC}"
    echo "  1. Open http://$SERVER_IP:$DASH_PORT in your browser"
    echo "  2. Sign up as admin (email + password)"
    echo "  3. Go to 'Cloud Providers' → 'Add AWS Account'"
    echo "  4. Follow the wizard to connect your AWS"
    echo "  5. Start monitoring & saving!"
    echo ""
    echo -e "${YELLOW}📖 Documentation:${NC} https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS"
    echo -e "${YELLOW}🐛 Support:${NC} https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS/issues"
    echo ""
else
    echo -e "${RED}"
    echo "  ╔═══════════════════════════════════════════════════╗"
    echo "  ║          ⚠️  INSTALLATION INCOMPLETE             ║"
    echo "  ╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "  Services may still be starting up. Check with:"
    echo -e "  ${BLUE}docker compose ps${NC}"
    echo ""
    echo "  View logs:"
    echo -e "  ${BLUE}docker compose logs -f greenops-api${NC}"
    echo ""
fi
