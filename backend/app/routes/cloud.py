# ============================================
# Cloud Provider Integration (AWS)
# 100% FREE - No paid APIs used
# ============================================
import logging
import boto3
from datetime import datetime, timezone
from botocore.exceptions import ClientError
from fastapi import APIRouter, Body, HTTPException, Header
from app import database as db
from app.routes.auth import verify_jwt

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================
# AWS Pricing Table (FREE - Public Data)
# Prices in USD per hour for us-east-1
# ============================================
INSTANCE_PRICING = {
    "t2.nano": 0.0058, "t2.micro": 0.0116, "t2.small": 0.023,
    "t2.medium": 0.0464, "t2.large": 0.0928, "t2.xlarge": 0.1856,
    "t3.nano": 0.0052, "t3.micro": 0.0104, "t3.small": 0.0208,
    "t3.medium": 0.0416, "t3.large": 0.0832, "t3.xlarge": 0.1664,
    "t3.2xlarge": 0.3328,
    "m5.large": 0.096, "m5.xlarge": 0.192, "m5.2xlarge": 0.384,
    "m5.4xlarge": 0.768, "m5.8xlarge": 1.536,
    "c5.large": 0.085, "c5.xlarge": 0.17, "c5.2xlarge": 0.34,
    "c5.4xlarge": 0.68, "c5.9xlarge": 1.53,
    "r5.large": 0.126, "r5.xlarge": 0.252, "r5.2xlarge": 0.504,
    "r5.4xlarge": 1.008,
}

# ============================================
# Grid Carbon Factors (FREE - Public Data)
# kg CO2 per kWh
# ============================================
GRID_CARBON = {
    "us-east-1": 0.379,      # N. Virginia (coal + gas)
    "us-east-2": 0.517,      # Ohio (coal)
    "us-west-1": 0.313,      # N. California
    "us-west-2": 0.082,      # Oregon (hydro!)
    "eu-west-1": 0.316,      # Ireland
    "eu-west-2": 0.253,      # London
    "eu-north-1": 0.041,     # Stockholm (green!)
    "ap-south-1": 0.708,     # Mumbai (coal)
    "ap-southeast-1": 0.408, # Singapore
    "ap-northeast-1": 0.506, # Tokyo
}

# Power consumption model
IDLE_WATTS = 35
MAX_WATTS = 90


def get_price(instance_type):
    """Get hourly price. Falls back to average."""
    return INSTANCE_PRICING.get(instance_type, 0.05)


def get_grid_factor(region):
    """Get carbon intensity for region."""
    return GRID_CARBON.get(region, 0.5)


def get_current_user(auth_header):
    """Verify JWT and return user."""
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = verify_jwt(auth_header.replace("Bearer ", ""))
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


def assume_customer_role(role_arn, external_id=None):
    """
    Assume customer's IAM role using STS (FREE).
    Returns temporary credentials.
    """
    try:
        sts = boto3.client('sts')
        params = {
            "RoleArn": role_arn,
            "RoleSessionName": "GreenOpsMonitoring",
            "DurationSeconds": 3600  # 1 hour
        }
        if external_id:
            params["ExternalId"] = external_id
        
        response = sts.assume_role(**params)
        return response['Credentials']
    except ClientError as e:
        logger.error(f"Assume role failed: {e}")
        return None


def get_ec2_client(credentials, region):
    """Create EC2 client with assumed credentials."""
    return boto3.client(
        'ec2',
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken'],
        region_name=region
    )


def get_cloudwatch_client(credentials, region):
    """Create CloudWatch client (FREE)."""
    return boto3.client(
        'cloudwatch',
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken'],
        region_name=region
    )


# ============================================
# CONNECT AWS ACCOUNT
# ============================================
@router.post("/connect-aws")
async def connect_aws(
    payload: dict = Body(...),
    authorization: str = Header(None)
):
    """Save AWS account connection for user."""
    try:
        user = get_current_user(authorization)
        user_id = user["user_id"]
        
        role_arn = payload.get("role_arn", "").strip()
        region = payload.get("region", "us-east-1")
        account_name = payload.get("account_name", "Production")
        external_id = payload.get("external_id")
        
        if not role_arn:
            return {"success": False, "error": "Role ARN required"}
        
        if not role_arn.startswith("arn:aws:iam::"):
            return {"success": False, "error": "Invalid IAM Role ARN format"}
        
        # Test the connection
        credentials = assume_customer_role(role_arn, external_id)
        if not credentials:
            return {
                "success": False, 
                "error": "Failed to assume role. Check IAM trust policy allows this AWS account."
            }
        
        # Try listing instances to verify permissions
        try:
            ec2 = get_ec2_client(credentials, region)
            ec2.describe_instances(MaxResults=5)
        except ClientError as e:
            return {"success": False, "error": f"Permission check failed: {str(e)}"}
        
        # Save to MongoDB
        database = db.get_db()
        connection = {
            "user_id": user_id,
            "provider": "aws",
            "account_name": account_name,
            "role_arn": role_arn,
            "region": region,
            "external_id": external_id,
            "connected_at": datetime.now(timezone.utc),
            "status": "active"
        }
        
        # Upsert (update if exists, insert if not)
        database["cloud_connections"].update_one(
            {"user_id": user_id, "role_arn": role_arn},
            {"$set": connection},
            upsert=True
        )
        
        return {
            "success": True,
            "message": f"AWS account '{account_name}' connected successfully!",
            "connection": {
                "account_name": account_name,
                "region": region,
                "role_arn": role_arn
            }
        }
    except Exception as e:
        logger.error(f"connect-aws error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


# ============================================
# LIST CONNECTED ACCOUNTS
# ============================================
@router.get("/accounts")
async def list_accounts(authorization: str = Header(None)):
    """List all cloud accounts for current user."""
    try:
        user = get_current_user(authorization)
        database = db.get_db()
        accounts = list(database["cloud_connections"].find(
            {"user_id": user["user_id"]},
            {"_id": 0, "external_id": 0}  # Hide sensitive data
        ))
        # Convert datetime to string
        for acc in accounts:
            if isinstance(acc.get("connected_at"), datetime):
                acc["connected_at"] = acc["connected_at"].isoformat()
        return {"success": True, "accounts": accounts}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================
# GET REAL EC2 INSTANCES
# ============================================
@router.get("/aws-instances")
async def get_aws_instances(authorization: str = Header(None)):
    """Get real EC2 instances from customer's AWS account."""
    try:
        user = get_current_user(authorization)
        database = db.get_db()
        
        # Get user's AWS connections
        connections = list(database["cloud_connections"].find(
            {"user_id": user["user_id"], "provider": "aws"}
        ))
        
        if not connections:
            return {
                "success": True,
                "instances": [],
                "message": "No AWS accounts connected yet"
            }
        
        all_instances = []
        total_cost_per_hour = 0
        total_carbon_per_hour = 0
        
        for conn in connections:
            try:
                # Assume role for this connection
                creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
                if not creds:
                    continue
                
                # Get EC2 instances (FREE API)
                ec2 = get_ec2_client(creds, conn["region"])
                response = ec2.describe_instances()
                
                for reservation in response.get("Reservations", []):
                    for instance in reservation.get("Instances", []):
                        state = instance.get("State", {}).get("Name", "unknown")
                        instance_type = instance.get("InstanceType", "unknown")
                        instance_id = instance.get("InstanceId", "unknown")
                        
                        # Calculate cost (using our free pricing table)
                        hourly_cost = get_price(instance_type) if state == "running" else 0
                        
                        # Calculate carbon (using free grid factor)
                        grid_factor = get_grid_factor(conn["region"])
                        # Assume 50% CPU (would use CloudWatch for real)
                        power_kw = (IDLE_WATTS + (MAX_WATTS - IDLE_WATTS) * 0.5) / 1000
                        hourly_carbon = power_kw * grid_factor if state == "running" else 0
                        
                        # Get name tag
                        name = instance_id
                        for tag in instance.get("Tags", []):
                            if tag.get("Key") == "Name":
                                name = tag.get("Value")
                                break
                        
                        all_instances.append({
                            "instance_id": instance_id,
                            "name": name,
                            "type": instance_type,
                            "state": state,
                            "region": conn["region"],
                            "account_name": conn["account_name"],
                            "public_ip": instance.get("PublicIpAddress", "-"),
                            "private_ip": instance.get("PrivateIpAddress", "-"),
                            "launch_time": instance.get("LaunchTime", "").isoformat() if instance.get("LaunchTime") else None,
                            "hourly_cost_usd": round(hourly_cost, 4),
                            "hourly_carbon_kg": round(hourly_carbon, 4),
                            "daily_cost_usd": round(hourly_cost * 24, 2),
                            "daily_carbon_kg": round(hourly_carbon * 24, 4),
                        })
                        
                        if state == "running":
                            total_cost_per_hour += hourly_cost
                            total_carbon_per_hour += hourly_carbon
            
            except Exception as e:
                logger.error(f"Error fetching instances for {conn['account_name']}: {e}")
                continue
        
        return {
            "success": True,
            "instances": all_instances,
            "total_running": len([i for i in all_instances if i["state"] == "running"]),
            "total_stopped": len([i for i in all_instances if i["state"] == "stopped"]),
            "total_hourly_cost": round(total_cost_per_hour, 4),
            "total_daily_cost": round(total_cost_per_hour * 24, 2),
            "total_monthly_cost": round(total_cost_per_hour * 24 * 30, 2),
            "total_hourly_carbon": round(total_carbon_per_hour, 4),
            "total_daily_carbon": round(total_carbon_per_hour * 24, 2),
            "total_monthly_carbon": round(total_carbon_per_hour * 24 * 30, 2),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_aws_instances error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


# ============================================
# DISCONNECT AWS ACCOUNT
# ============================================
@router.delete("/accounts/{role_arn:path}")
async def disconnect_account(role_arn: str, authorization: str = Header(None)):
    """Disconnect an AWS account."""
    try:
        user = get_current_user(authorization)
        database = db.get_db()
        result = database["cloud_connections"].delete_one({
            "user_id": user["user_id"],
            "role_arn": role_arn
        })
        return {"success": True, "deleted": result.deleted_count > 0}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================
# INSTALLATION SCRIPT DOWNLOAD
# ============================================
@router.get("/install-script")
async def get_install_script():
    """Return the install.sh script content."""
    script = '''#!/bin/bash
# ============================================
# GreenOps Autonomous - Auto Installer
# ============================================

set -e

echo ""
echo "======================================"
echo "  🌿 GreenOps Autonomous Installer"
echo "======================================"
echo ""

# Check OS
if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Unsupported OS. Only Linux/Mac supported."
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo apt install -y docker-compose-plugin
fi

# Clone repo
if [ ! -d "greenops-autonomous" ]; then
    echo "⬇️  Downloading GreenOps..."
    git clone https://github.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS.git greenops-autonomous
fi

cd greenops-autonomous

# Start services
echo "🚀 Starting GreenOps services..."
docker compose up -d

# Wait for services
echo "⏳ Waiting for services to be healthy (30s)..."
sleep 30

# Get IP
IP=$(hostname -I | awk '{print $1}')

echo ""
echo "======================================"
echo "  ✅ GreenOps Installed Successfully!"
echo "======================================"
echo ""
echo "  🎛️  Dashboard: http://$IP:3000"
echo "  🚪 Portal:    http://$IP:5001"
echo "  🔌 API:       http://$IP:8000"
echo ""
echo "  📚 Next steps:"
echo "  1. Open http://$IP:3000 in your browser"
echo "  2. Sign up for an admin account"
echo "  3. Add your AWS account (Settings → Cloud Providers)"
echo ""
echo "======================================"
'''
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content=script, headers={
        "Content-Disposition": "attachment; filename=install.sh"
    })


# ============================================
# CloudFormation One-Click Setup
# ============================================
import secrets
from fastapi.responses import FileResponse, PlainTextResponse
import os as _os


@router.get("/cloudformation-template")
async def get_cloudformation_template():
    """Serve the CloudFormation template."""
    template_path = _os.path.join(
        _os.path.dirname(__file__), 
        "..", "templates", 
        "greenops-role.yaml"
    )
    if _os.path.exists(template_path):
        with open(template_path, "r") as f:
            content = f.read()
        return PlainTextResponse(content, media_type="text/yaml")
    return {"error": "Template not found"}


@router.post("/generate-setup-link")
async def generate_setup_link(authorization: str = Header(None)):
    """Generate one-click AWS setup link with unique External ID."""
    try:
        user = get_current_user(authorization)
        
        # Generate unique External ID for this user
        external_id = f"greenops-{user['user_id']}-{secrets.token_hex(8)}"
        
        # Save to database (associates external_id with user)
        database = db.get_db()
        database["pending_setups"].update_one(
            {"user_id": user["user_id"]},
            {"$set": {
                "external_id": external_id,
                "created_at": datetime.now(timezone.utc),
                "status": "pending"
            }},
            upsert=True
        )
        
        # Template URL (users need to host this publicly OR use S3)
        # For demo: use raw GitHub URL or local file
        template_url = "https://raw.githubusercontent.com/kirangunaga992/GREEN-CLOUD-AUTONOMUS/main/backend/app/templates/greenops-role.yaml"
        
        # AWS Console one-click launch URL
        launch_url = (
            f"https://console.aws.amazon.com/cloudformation/home"
            f"?region=us-east-1"
            f"#/stacks/quickcreate"
            f"?templateURL={template_url}"
            f"&stackName=GreenOpsSetup"
            f"&param_ExternalId={external_id}"
            f"&param_GreenOpsAccountId=736461510325"
        )
        
        return {
            "success": True,
            "launch_url": launch_url,
            "external_id": external_id,
            "instructions": [
                "Click the button below to open AWS Console",
                "Log in to your AWS account (if not already)",
                "Review the settings (already pre-filled)",
                "Check the acknowledgment checkbox",
                "Click 'Create stack'",
                "Wait 30 seconds for AWS to create the role",
                "Go to Outputs tab and copy the RoleArn",
                "Come back here and paste it"
            ]
        }
    except Exception as e:
        logger.error(f"generate-setup-link error: {e}")
        return {"success": False, "error": str(e)}
