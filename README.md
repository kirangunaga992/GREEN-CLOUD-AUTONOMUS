# GreenOps Autonomous

AI-Driven Sustainable Cloud Infrastructure with Predictive Auto-Scaling

A production-grade cloud platform that automatically scales resources based on real user demand, saving up to 60% energy and 40% costs compared to traditional always-on cloud infrastructure.

## Features

- AI-Powered Auto-Scaling with Prophet ML
- Scale-to-Zero when no users online
- Multi-User SaaS Platform
- Grafana-Style Admin Dashboard
- AI Chatbot Assistant
- Real-Time Billing and Energy Tracking
- Cloudflare Tunnel for Public Access
- Docker Compose Ready
- Kubernetes Manifests Included
- Prometheus and Grafana Monitoring

## Architecture
Users (Any Device via Cloudflare)
|
Traffic Gateway (Port 5001)
|
+----+----+
| |
Backend Workload
FastAPI Flask
:8000 :5000
|
MongoDB
:27017
|
React Dashboard
Port 3000

text


## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18 or higher
- Git
- 4GB free RAM
- 5GB free disk space

### Installation

```bash
# Clone repository
git clone https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS.git
cd GREEN-CLOUD-AUTONOMUS

# Start backend services
docker compose up -d

# Wait 30 seconds
sleep 30

# Verify all healthy
docker compose ps

# Install frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
Access URLs
Admin Dashboard: http://localhost:3000
User Portal: http://localhost:5001
Backend API: http://localhost:8000/docs
Workload: http://localhost:5000/health
Remote Access via Cloudflare
Share with friends across the internet:

Bash

# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:5001
Copy the generated URL and share with friends!

Technology Stack
Frontend
React 18 with Vite
Tailwind CSS 4
Recharts for charts
React Router
Axios
Backend
Python 3.11 with FastAPI
MongoDB 7.0
Prophet ML for predictions
APScheduler
Uvicorn
Gateway
Flask 3.0
Gunicorn
Custom HTML/CSS/JS portal
Infrastructure
Docker and Docker Compose
Kubernetes (optional)
Cloudflare Tunnel
Prometheus and Grafana
Project Structure
text

greenops-autonomous/
├── backend/          FastAPI backend with ML
├── frontend/         React admin dashboard
├── gateway/          Traffic gateway + user portal
├── workload/         Scalable workload service
├── k8s/              Kubernetes manifests
├── docker-compose.yml
└── README.md
How It Works
User arrives via Cloudflare tunnel
Gateway creates session
Backend detects user
Auto-scaler increases pods (0 to 1)
User consumes cloud services
Metrics tracked in MongoDB
Prophet ML predicts future traffic
When users leave, scale back to zero
Dashboard shows everything real-time
Available Services
Data Analytics: 0.0016 INR per use
AI Compute: 0.0064 INR per use
File Storage: 0.0008 INR per use
Email Service: 0.0008 INR per use
Video Processing: 0.0080 INR per use
Environmental Impact
Using India grid emission factor of 0.708 kg CO2 per kWh:

60-80% Energy Savings vs always-on cloud
40-60% Carbon Emission Reduction
40-60% Cost Savings
True scale-to-zero capability
Common Commands
Docker
Bash

docker compose up -d          # Start all
docker compose down            # Stop all
docker compose ps              # Check status
docker compose logs -f         # View logs
Frontend
Bash

cd frontend
npm install --legacy-peer-deps
npm run dev
Git
Bash

git add .
git commit -m "message"
git push
Troubleshooting
Port already in use
Bash

docker compose down
docker compose up -d
Frontend not starting
Bash

cd frontend
rm -rf node_modules .vite
npm install --legacy-peer-deps
npm run dev
MongoDB connection failed
Bash

docker compose restart mongodb
Demo Flow
Start platform with docker compose up -d
Open admin dashboard at localhost:3000
Empty state: 0 users, 0 pods
Open user portal at localhost:5001
Sign up new user
Login and use services
Watch admin dashboard update live
Logout and wait 60 seconds
See scale-to-zero happen
See energy savings on dashboard
Contributors
Rohan - Project Lead
License
MIT License - Free for educational use

Contact
Open an issue on GitHub for questions!

Made with love for a sustainable future.


