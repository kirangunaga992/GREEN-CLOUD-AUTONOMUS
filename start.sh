#!/bin/bash

echo "================================"
echo " Starting GreenOps Platform"
echo "================================"

cd ~/greenops-autonomous

echo ""
echo "[1/3] Starting Docker services..."
docker compose up -d
sleep 5

echo ""
echo "[2/3] Checking services health..."
docker compose ps

echo ""
echo "[3/3] Testing endpoints..."
echo "Backend: $(curl -s http://localhost:8000/health | head -c 50)"
echo "Gateway: $(curl -s http://localhost:5001/health | head -c 50)"

echo ""
echo "================================"
echo " ✅ READY!"
echo "================================"
echo ""
echo " Now open 2 more terminals and run:"
echo ""
echo " Terminal 2 (Frontend):"
echo "   cd ~/greenops-autonomous/frontend && npm run dev"
echo ""
echo " Terminal 3 (Public URL for friends):"
echo "   cloudflared tunnel --url http://localhost:5001"
echo ""
echo " Then open:"
echo "   Admin Dashboard: http://localhost:3000"
echo "   User Portal:     http://localhost:5001"
echo ""
