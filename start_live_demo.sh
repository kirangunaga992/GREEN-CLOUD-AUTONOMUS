#!/bin/bash
set -e

cd ~/greenops-autonomous

echo "=========================================================="
echo "🌿 GREENOPS AUTONOMOUS - LIVE DEMO LAUNCHER"
echo "=========================================================="
echo ""

# 1. Start Docker Containers
echo "🚀 [1/5] Ensuring Docker containers are running..."
docker compose up -d
sleep 3

# 2. Kill old tunnels
echo "🧹 [2/5] Cleaning up old Cloudflare processes..."
pkill cloudflared 2>/dev/null || true
sleep 2

# 3. Launch Tunnels in Background
echo "🌐 [3/5] Launching public Cloudflare Tunnels..."
nohup cloudflared tunnel --url http://localhost:3000 > ~/dash-tunnel.log 2>&1 &
nohup cloudflared tunnel --url http://localhost:8000 > ~/api-tunnel.log 2>&1 &
nohup cloudflared tunnel --url http://localhost:5001 > ~/portal-tunnel.log 2>&1 &

echo "⏳ [4/5] Waiting 25s for Cloudflare connections..."
sleep 25

# Extract Generated URLs
DASH_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' ~/dash-tunnel.log | head -1)
API_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' ~/api-tunnel.log | head -1)
PORTAL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' ~/portal-tunnel.log | head -1)

if [ -z "$API_URL" ] || [ -z "$DASH_URL" ]; then
    echo "❌ Failed to establish Cloudflare tunnels. Check your internet connection and re-run."
    exit 1
fi

WS_URL=$(echo $API_URL | sed 's|https://|wss://|')

# 4. Patch & Rebuild Frontend
echo "🔧 [5/5] Updating Frontend with live API tunnel URLs..."
cd ~/greenops-autonomous/greenops-dashboard

find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec sed -i \
  -e "s|http://localhost:8000|$API_URL|g" \
  -e "s|ws://localhost:8000|$WS_URL|g" \
  -e "s|https://[a-z0-9-]*\.trycloudflare\.com/ws|$WS_URL/ws|g" \
  -e "s|https://[a-z0-9-]*\.trycloudflare\.com/api|$API_URL/api|g" \
  -e "s|https://[a-z0-9-]*\.trycloudflare\.com|$API_URL|g" {} +

NODE_OPTIONS="--max-old-space-size=768" npm run build >/dev/null 2>&1

cd ~/greenops-autonomous
docker compose restart dashboard >/dev/null 2>&1
sleep 3

# Get Instance ID dynamically if available
INST_ID=$(docker exec greenops-autonomous-greenops-api-1 python -c "
import boto3
try:
    sts = boto3.client('sts')
    c = sts.assume_role(RoleArn='arn:aws:iam::736461510325:role/GreenOpsReadOnly', RoleSessionName='S')['Credentials']
    ec2 = boto3.client('ec2', aws_access_key_id=c['AccessKeyId'], aws_secret_access_key=c['SecretAccessKey'], aws_session_token=c['SessionToken'], region_name='us-east-1')
    r = ec2.describe_instances()
    print(r['Reservations'][0]['Instances'][0]['InstanceId'])
except:
    print('i-04d386f4a017d1e99')
" 2>/dev/null || echo "i-04d386f4a017d1e99")

echo ""
echo "=========================================================="
echo "🎉 DEMO IS LIVE! COPY & SEND THIS MESSAGE TO YOUR MENTOR:"
echo "=========================================================="
echo ""
echo "Sir, GreenOps Autonomous is live and accessible from any device:"
echo ""
echo "📊 Public Admin Dashboard:"
echo "$DASH_URL"
echo ""
echo "🚪 Public User Portal:"
echo "$PORTAL_URL"
echo ""
echo "⚡ Live EC2 Scale-To-Zero / Wake-Up Proxy Link:"
echo "$API_URL/api/cloud/aws-proxy/$INST_ID"
echo ""
echo "=========================================================="
