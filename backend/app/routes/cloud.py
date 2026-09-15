# ============================================
# Cloud Provider Integration (AWS)
# 100% FREE - No paid APIs used
# ============================================
import logging
import boto3
from datetime import datetime, timezone
from botocore.exceptions import ClientError
from fastapi import APIRouter, Request, Response, Body, HTTPException, Header
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
    Assume customer's IAM role using STS.
    Smart fallback: Tries with ExternalId first, then without if AWS rejects.
    """
    sts = boto3.client('sts')
    
    if external_id:
        try:
            response = sts.assume_role(
                RoleArn=role_arn,
                RoleSessionName="GreenOpsMonitoring",
                ExternalId=external_id,
                DurationSeconds=3600
            )
            return response['Credentials']
        except ClientError as e:
            logger.warning(f"AssumeRole with ExternalId failed ({e}), trying without ExternalId...")

    try:
        response = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName="GreenOpsMonitoring",
            DurationSeconds=3600
        )
        return response['Credentials']
    except ClientError as e:
        logger.error(f"AssumeRole failed: {e}")
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


# ============================================
# EXPANDED SERVICE MONITORING
# Monitor S3, RDS, Lambda, EBS, ELB, etc.
# ============================================

def get_service_clients(credentials, region):
    """Create clients for multiple AWS services."""
    common = {
        "aws_access_key_id": credentials['AccessKeyId'],
        "aws_secret_access_key": credentials['SecretAccessKey'],
        "aws_session_token": credentials['SessionToken'],
        "region_name": region
    }
    return {
        "ec2": boto3.client('ec2', **common),
        "s3": boto3.client('s3', **common),
        "rds": boto3.client('rds', **common),
        "lambda": boto3.client('lambda', **common),
        "elbv2": boto3.client('elbv2', **common),
        "cloudwatch": boto3.client('cloudwatch', **common),
        "dynamodb": boto3.client('dynamodb', **common),
    }


@router.get("/aws-full-inventory")
async def get_full_aws_inventory(authorization: str = Header(None)):
    """Get ALL AWS resources across services for a user's connected accounts."""
    try:
        user = get_current_user(authorization)
        database = db.get_db()
        
        connections = list(database["cloud_connections"].find(
            {"user_id": user["user_id"], "provider": "aws"}
        ))
        
        if not connections:
            return {"success": True, "inventory": {}, "message": "No AWS accounts connected"}
        
        all_data = {
            "ec2_instances": [],
            "s3_buckets": [],
            "rds_databases": [],
            "lambda_functions": [],
            "ebs_volumes": [],
            "load_balancers": [],
            "dynamodb_tables": [],
        }
        
        for conn in connections:
            try:
                creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
                if not creds:
                    continue
                
                clients = get_service_clients(creds, conn["region"])
                account_name = conn["account_name"]
                region = conn["region"]
                
                # 1. EC2 INSTANCES
                try:
                    response = clients["ec2"].describe_instances()
                    for r in response.get("Reservations", []):
                        for i in r.get("Instances", []):
                            name = next((t["Value"] for t in i.get("Tags", []) if t["Key"] == "Name"), i.get("InstanceId"))
                            state = i.get("State", {}).get("Name", "unknown")
                            itype = i.get("InstanceType", "unknown")
                            
                            all_data["ec2_instances"].append({
                                "account": account_name,
                                "region": region,
                                "name": name,
                                "id": i.get("InstanceId"),
                                "type": itype,
                                "state": state,
                                "public_ip": i.get("PublicIpAddress", "-"),
                                "cost_per_hour": get_price(itype) if state == "running" else 0,
                                "carbon_per_hour": (IDLE_WATTS + (MAX_WATTS - IDLE_WATTS) * 0.5) / 1000 * get_grid_factor(region) if state == "running" else 0,
                            })
                except Exception as e:
                    logger.warning(f"EC2 error: {e}")
                
                # 2. S3 BUCKETS
                try:
                    response = clients["s3"].list_buckets()
                    for b in response.get("Buckets", []):
                        # Try to get bucket size (approximation)
                        try:
                            metrics = clients["cloudwatch"].get_metric_statistics(
                                Namespace='AWS/S3',
                                MetricName='BucketSizeBytes',
                                Dimensions=[
                                    {'Name': 'BucketName', 'Value': b['Name']},
                                    {'Name': 'StorageType', 'Value': 'StandardStorage'}
                                ],
                                StartTime=datetime.now(timezone.utc) - timedelta(days=2),
                                EndTime=datetime.now(timezone.utc),
                                Period=86400,
                                Statistics=['Average']
                            )
                            size_bytes = metrics['Datapoints'][0]['Average'] if metrics['Datapoints'] else 0
                            size_gb = size_bytes / (1024 ** 3)
                        except:
                            size_gb = 0
                        
                        # S3 Standard: $0.023 per GB per month
                        monthly_cost = size_gb * 0.023
                        
                        all_data["s3_buckets"].append({
                            "account": account_name,
                            "name": b['Name'],
                            "created": b['CreationDate'].strftime("%Y-%m-%d") if b.get('CreationDate') else "-",
                            "size_gb": round(size_gb, 2),
                            "monthly_cost": round(monthly_cost, 2),
                        })
                except Exception as e:
                    logger.warning(f"S3 error: {e}")
                
                # 3. RDS DATABASES
                try:
                    response = clients["rds"].describe_db_instances()
                    for db_inst in response.get("DBInstances", []):
                        instance_class = db_inst.get('DBInstanceClass', 'db.t3.micro')
                        # Approximate RDS pricing (db.t3.micro = ~$0.017/hr)
                        rds_prices = {
                            "db.t3.micro": 0.017, "db.t3.small": 0.034,
                            "db.t3.medium": 0.068, "db.m5.large": 0.171,
                            "db.m5.xlarge": 0.342,
                        }
                        cost = rds_prices.get(instance_class, 0.05)
                        
                        all_data["rds_databases"].append({
                            "account": account_name,
                            "region": region,
                            "identifier": db_inst.get('DBInstanceIdentifier'),
                            "engine": db_inst.get('Engine'),
                            "class": instance_class,
                            "status": db_inst.get('DBInstanceStatus'),
                            "storage_gb": db_inst.get('AllocatedStorage', 0),
                            "cost_per_hour": cost,
                            "monthly_cost": round(cost * 24 * 30, 2),
                        })
                except Exception as e:
                    logger.warning(f"RDS error: {e}")
                
                # 4. LAMBDA FUNCTIONS
                try:
                    response = clients["lambda"].list_functions()
                    for fn in response.get("Functions", []):
                        # Lambda pricing: $0.20 per 1M requests + $0.0000166667 per GB-second
                        memory_mb = fn.get('MemorySize', 128)
                        all_data["lambda_functions"].append({
                            "account": account_name,
                            "region": region,
                            "name": fn.get('FunctionName'),
                            "runtime": fn.get('Runtime'),
                            "memory_mb": memory_mb,
                            "timeout_sec": fn.get('Timeout'),
                            "last_modified": fn.get('LastModified', ''),
                            "cost_per_million": round(0.20 + (memory_mb/1024) * 0.0000166667 * 1000000, 4),
                        })
                except Exception as e:
                    logger.warning(f"Lambda error: {e}")
                
                # 5. EBS VOLUMES
                try:
                    response = clients["ec2"].describe_volumes()
                    for v in response.get("Volumes", []):
                        # EBS gp3: $0.08 per GB/month
                        size_gb = v.get('Size', 0)
                        monthly_cost = size_gb * 0.08
                        
                        all_data["ebs_volumes"].append({
                            "account": account_name,
                            "region": region,
                            "id": v.get('VolumeId'),
                            "size_gb": size_gb,
                            "type": v.get('VolumeType'),
                            "state": v.get('State'),
                            "monthly_cost": round(monthly_cost, 2),
                        })
                except Exception as e:
                    logger.warning(f"EBS error: {e}")
                
                # 6. LOAD BALANCERS
                try:
                    response = clients["elbv2"].describe_load_balancers()
                    for lb in response.get("LoadBalancers", []):
                        # ALB: $0.0225 per hour = ~$16.20/month
                        all_data["load_balancers"].append({
                            "account": account_name,
                            "region": region,
                            "name": lb.get('LoadBalancerName'),
                            "type": lb.get('Type', 'application'),
                            "state": lb.get('State', {}).get('Code'),
                            "scheme": lb.get('Scheme'),
                            "monthly_cost": 16.20,
                        })
                except Exception as e:
                    logger.warning(f"ELB error: {e}")
                
                # 7. DYNAMODB TABLES
                try:
                    response = clients["dynamodb"].list_tables()
                    for table_name in response.get("TableNames", []):
                        try:
                            detail = clients["dynamodb"].describe_table(TableName=table_name)
                            size_bytes = detail['Table'].get('TableSizeBytes', 0)
                            size_gb = size_bytes / (1024 ** 3)
                            all_data["dynamodb_tables"].append({
                                "account": account_name,
                                "region": region,
                                "name": table_name,
                                "status": detail['Table'].get('TableStatus'),
                                "size_gb": round(size_gb, 2),
                                "item_count": detail['Table'].get('ItemCount', 0),
                                "monthly_cost": round(size_gb * 0.25, 2),  # $0.25/GB/month
                            })
                        except Exception:
                            pass
                except Exception as e:
                    logger.warning(f"DynamoDB error: {e}")
            
            except Exception as e:
                logger.error(f"Account {conn['account_name']} error: {e}")
                continue
        
        # Calculate totals
        totals = {
            "ec2_count": len(all_data["ec2_instances"]),
            "ec2_running": len([i for i in all_data["ec2_instances"] if i["state"] == "running"]),
            "s3_count": len(all_data["s3_buckets"]),
            "s3_total_gb": round(sum(b["size_gb"] for b in all_data["s3_buckets"]), 2),
            "rds_count": len(all_data["rds_databases"]),
            "lambda_count": len(all_data["lambda_functions"]),
            "ebs_count": len(all_data["ebs_volumes"]),
            "ebs_total_gb": sum(v["size_gb"] for v in all_data["ebs_volumes"]),
            "load_balancer_count": len(all_data["load_balancers"]),
            "dynamodb_count": len(all_data["dynamodb_tables"]),
            "total_monthly_cost": round(
                sum(i["cost_per_hour"] * 24 * 30 for i in all_data["ec2_instances"]) +
                sum(b["monthly_cost"] for b in all_data["s3_buckets"]) +
                sum(d["monthly_cost"] for d in all_data["rds_databases"]) +
                sum(v["monthly_cost"] for v in all_data["ebs_volumes"]) +
                sum(lb["monthly_cost"] for lb in all_data["load_balancers"]) +
                sum(t["monthly_cost"] for t in all_data["dynamodb_tables"]),
                2
            ),
        }
        
        return {
            "success": True,
            "inventory": all_data,
            "totals": totals,
        }
    
    except Exception as e:
        logger.error(f"full inventory error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


# ============================================
# AWS EC2 AUTO-WAKE & AUTO-STOP WEB PROXY
# ============================================
import time
from fastapi.responses import HTMLResponse, RedirectResponse

# Track last request time per EC2 instance
_ec2_last_request = {}


# Track last traffic timestamp per EC2 instance
_ec2_last_request = {}


@router.api_route("/aws-proxy/{instance_id}/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def aws_web_proxy(instance_id: str, path: str = "", request: Request = None):
    try:
        now = time.time()
        _ec2_last_request[instance_id] = now
        
        database = db.get_db()
        conn = database["cloud_connections"].find_one({"provider": "aws"})
        if not conn:
            return HTMLResponse("<h2>❌ No AWS account connected.</h2>", status_code=400)
            
        creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
        if not creds:
            return HTMLResponse("<h2>❌ AWS Auth Failed.</h2>", status_code=401)
            
        ec2 = get_ec2_client(creds, conn["region"])
        res = ec2.describe_instances(InstanceIds=[instance_id])
        inst = res["Reservations"][0]["Instances"][0]
        state = inst["State"]["Name"]
        public_ip = inst.get("PublicIpAddress")
        
        if state in ["stopped", "stopping"]:
            logger.info(f"🌿 GreenOps: Starting EC2 {instance_id}...")
            ec2.start_instances(InstanceIds=[instance_id])
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>GreenOps Scale-To-Zero</title>
                <meta http-equiv="refresh" content="4">
                <style>
                    body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
                    .card { background: #11161D; border: 1px solid #22C55E; padding: 40px; border-radius: 12px; text-align: center; max-width: 480px; box-shadow: 0 0 30px rgba(34,197,94,0.2); }
                    .spinner { border: 4px solid #1F2933; border-top: 4px solid #22C55E; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .badge { background: rgba(34,197,94,0.2); color: #22C55E; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="card">
                    <span class="badge">🌱 GreenOps Scale-To-Zero</span>
                    <h2 style="margin-top: 15px;">Waking Up Server on AWS...</h2>
                    <p style="color: #94A3B8; font-size: 14px;">This server was stopped to save <b>100% energy</b>. Starting EC2...</p>
                    <div class="spinner"></div>
                </div>
            </body>
            </html>
            """
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "pending":
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Starting...</title>
                <meta http-equiv="refresh" content="3">
                <style>
                    body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; }
                    .card { background: #11161D; border: 1px solid #3B82F6; padding: 30px; border-radius: 10px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h3 style="color: #3B82F6;">⚡ Booting EC2 Instance...</h3>
                    <p>Connecting to Web Application...</p>
                </div>
            </body>
            </html>
            """
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "running" and public_ip:
            # INSTANT REDIRECT TO LIVE EC2 APP
            return RedirectResponse(url=f"http://{public_ip}/{path}")
        else:
            return HTMLResponse(f"<h2>Server status: {state}. Refreshing...</h2><meta http-equiv='refresh' content='2'>", status_code=200)
            
    except Exception as e:
        logger.error(f"aws_web_proxy error: {e}")
        return HTMLResponse(f"<h2>Proxy Error: {str(e)}</h2>", status_code=500)


@router.post("/aws-proxy/ping/{instance_id}")
@router.get("/aws-proxy/ping/{instance_id}")
async def aws_proxy_ping(instance_id: str):
    """Keep-alive ping sent while user tab is open."""
    _ec2_last_request[instance_id] = time.time() # RESET IDLE TIMER!
    return {"status": "active", "instance_id": instance_id, "timestamp": time.time()}


@router.post("/check-ec2-idle-shutdown")
async def check_ec2_idle_shutdown(idle_seconds: int = 120):
    """
    Autonomous Job:
    - If user is browsing/pinging -> Timer resets. Server STAYS ALIVE.
    - If traffic == 0 for 120 seconds -> AUTONOMOUSLY STOPS EC2 ON AWS!
    """
    try:
        database = db.get_db()
        all_conns = list(database["cloud_connections"].find({"provider": "aws"}))
        if not all_conns:
            return {"success": False, "message": "No AWS connections found"}
            
        stopped_list = []
        now = time.time()
        
        for conn in all_conns:
            try:
                creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
                if not creds:
                    continue
                    
                ec2 = get_ec2_client(creds, conn["region"])
                cw = get_cloudwatch_client(creds, conn["region"])
                response = ec2.describe_instances()
                
                for r in response.get("Reservations", []):
                    for i in r.get("Instances", []):
                        inst_id = i.get("InstanceId")
                        state = i.get("State", {}).get("Name")
                        
                        if state == "running":
                            if inst_id not in _ec2_last_request:
                                _ec2_last_request[inst_id] = now
                                
                            # Check CloudWatch NetworkIn traffic for last 3 minutes
                            has_cloudwatch_traffic = False
                            try:
                                net_stats = cw.get_metric_statistics(
                                    Namespace='AWS/EC2',
                                    MetricName='NetworkIn',
                                    Dimensions=[{'Name': 'InstanceId', 'Value': inst_id}],
                                    StartTime=datetime.now(timezone.utc) - timedelta(minutes=3),
                                    EndTime=datetime.now(timezone.utc),
                                    Period=180,
                                    Statistics=['Sum']
                                )
                                dps = net_stats.get('Datapoints', [])
                                if dps and dps[0].get('Sum', 0) > 1000: # Active network packets
                                    has_cloudwatch_traffic = True
                                    _ec2_last_request[inst_id] = now # Reset timer!
                                    logger.info(f"🟢 EC2 {inst_id} has live network traffic. Resetting idle timer.")
                            except Exception:
                                pass
                                
                            if has_cloudwatch_traffic:
                                continue

                            elapsed = now - _ec2_last_request[inst_id]
                            logger.info(f"⏱️ EC2 {inst_id}: RUNNING | Traffic = 0 | Idle: {int(elapsed)}s / {idle_seconds}s target")
                            
                            # SHUT DOWN ONLY WHEN IDLE FOR 120s (2 MINUTES)
                            if elapsed >= idle_seconds:
                                logger.info(f"💤 GreenOps Autonomous: 0 traffic on EC2 {inst_id} for {int(elapsed)}s. AUTONOMOUSLY STOPPING EC2 ON AWS...")
                                ec2.stop_instances(InstanceIds=[inst_id])
                                stopped_list.append(inst_id)
                                
                                database["scaling_events"].insert_one({
                                    "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                                    "current_replicas": 1,
                                    "desired_replicas": 0,
                                    "active_users": 0,
                                    "reason": f"Scale-to-Zero: 0 traffic on EC2 {inst_id} for {int(elapsed)}s. Shutting down.",
                                    "action": "scale_down",
                                    "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                                })
            except Exception as conn_err:
                logger.error(f"Error checking {conn.get('account_name')}: {conn_err}")
                
        return {"success": True, "stopped_instances": stopped_list}
    except Exception as e:
        logger.error(f"check_ec2_idle_shutdown error: {e}")
        return {"success": False, "error": str(e)}





@router.get("/aws-proxy/ping/{instance_id}")
@router.post("/aws-proxy/ping/{instance_id}")
async def aws_proxy_ping(instance_id: str):
    """Heartbeat ping from active web users to keep EC2 alive while browsing."""
    _ec2_last_request[instance_id] = time.time()
    return {"status": "active", "instance_id": instance_id, "timestamp": time.time()}


# Global Auto-Shutdown Toggle (True = Active, False = Safe Mode for Presentations)
_auto_shutdown_enabled = True

@router.get("/toggle-auto-shutdown")
@router.post("/toggle-auto-shutdown")
async def toggle_auto_shutdown(enable: bool = None):
    global _auto_shutdown_enabled
    if enable is not None:
        _auto_shutdown_enabled = enable
    else:
        _auto_shutdown_enabled = not _auto_shutdown_enabled
    logger.info(f"⚙️ Auto-Shutdown Mode is now: { 'ENABLED' if _auto_shutdown_enabled else 'DISABLED (Safe Mode)' }")
    return {"success": True, "auto_shutdown_enabled": _auto_shutdown_enabled}



@router.api_route("/aws-proxy/{instance_id}/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def aws_web_proxy(instance_id: str, path: str = "", request: Request = None):
    try:
        now = time.time()
        _ec2_last_request[instance_id] = now
        
        database = db.get_db()
        conn = database["cloud_connections"].find_one({"provider": "aws"})
        if not conn:
            return HTMLResponse("<h2>❌ No AWS account connected.</h2>", status_code=400)
            
        creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
        if not creds:
            return HTMLResponse("<h2>❌ AWS Auth Failed.</h2>", status_code=401)
            
        ec2 = get_ec2_client(creds, conn["region"])
        res = ec2.describe_instances(InstanceIds=[instance_id])
        inst = res["Reservations"][0]["Instances"][0]
        state = inst["State"]["Name"]
        public_ip = inst.get("PublicIpAddress")
        
        if state in ["stopped", "stopping"]:
            logger.info(f"🌿 GreenOps: Starting EC2 {instance_id}...")
            ec2.start_instances(InstanceIds=[instance_id])
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>GreenOps Scale-To-Zero</title>
                <meta http-equiv="refresh" content="4">
                <style>
                    body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
                    .card { background: #11161D; border: 1px solid #22C55E; padding: 40px; border-radius: 12px; text-align: center; max-width: 480px; box-shadow: 0 0 30px rgba(34,197,94,0.2); }
                    .spinner { border: 4px solid #1F2933; border-top: 4px solid #22C55E; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .badge { background: rgba(34,197,94,0.2); color: #22C55E; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="card">
                    <span class="badge">🌱 GreenOps Scale-To-Zero</span>
                    <h2 style="margin-top: 15px;">Waking Up Server on AWS...</h2>
                    <p style="color: #94A3B8; font-size: 14px;">This server was stopped to save <b>100% energy</b>. Starting EC2...</p>
                    <div class="spinner"></div>
                    <p style="font-size: 12px; color: #22C55E;">AWS EC2 Starting... Redirecting in a few seconds.</p>
                </div>
            </body>
            </html>
            """
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "pending":
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Starting...</title>
                <meta http-equiv="refresh" content="3">
                <style>
                    body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; }
                    .card { background: #11161D; border: 1px solid #3B82F6; padding: 30px; border-radius: 10px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h3 style="color: #3B82F6;">⚡ Booting EC2 Instance...</h3>
                    <p>Redirecting to Web Application...</p>
                </div>
            </body>
            </html>
            """
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "running" and public_ip:
            # INSTANT REDIRECT DIRECTLY TO LIVE EC2 WEBSITE
            return RedirectResponse(url=f"http://{public_ip}/{path}")
        else:
            return HTMLResponse(f"<h2>Server status: {state}. Refreshing...</h2><meta http-equiv='refresh' content='2'>", status_code=200)
            
    except Exception as e:
        logger.error(f"aws_web_proxy error: {e}")
        return HTMLResponse(f"<h2>Proxy Error: {str(e)}</h2>", status_code=500)



@router.api_route("/aws-proxy/{instance_id}/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def aws_web_proxy(instance_id: str, path: str = "", request: Request = None):
    try:
        now = time.time()
        _ec2_last_request[instance_id] = now
        
        database = db.get_db()
        conn = database["cloud_connections"].find_one({"provider": "aws"})
        if not conn:
            return HTMLResponse("<h2>❌ No AWS account connected.</h2>", status_code=400)
            
        creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
        if not creds:
            return HTMLResponse("<h2>❌ AWS Auth Failed.</h2>", status_code=401)
            
        ec2 = get_ec2_client(creds, conn["region"])
        res = ec2.describe_instances(InstanceIds=[instance_id])
        inst = res["Reservations"][0]["Instances"][0]
        state = inst["State"]["Name"]
        public_ip = inst.get("PublicIpAddress")
        
        if state in ["stopped", "stopping"]:
            logger.info(f"🌿 GreenOps: Starting EC2 {instance_id}...")
            ec2.start_instances(InstanceIds=[instance_id])
            html = """<!DOCTYPE html>
            <html><head><title>GreenOps Scale-To-Zero</title>
            <meta http-equiv="refresh" content="4">
            <style>
                body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
                .card { background: #11161D; border: 1px solid #22C55E; padding: 40px; border-radius: 12px; text-align: center; max-width: 480px; box-shadow: 0 0 30px rgba(34,197,94,0.2); }
                .spinner { border: 4px solid #1F2933; border-top: 4px solid #22C55E; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .badge { background: rgba(34,197,94,0.2); color: #22C55E; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            </style></head>
            <body><div class="card">
                <span class="badge">🌱 GreenOps Scale-To-Zero</span>
                <h2 style="margin-top: 15px;">Waking Up Server on AWS...</h2>
                <p style="color: #94A3B8; font-size: 14px;">This server was stopped to save <b>100% energy</b>. Starting EC2...</p>
                <div class="spinner"></div>
                <p style="font-size: 12px; color: #22C55E;">AWS EC2 Starting... Auto-refreshing in 4s.</p>
            </div></body></html>"""
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "pending":
            html = """<!DOCTYPE html>
            <html><head><title>Server Starting...</title>
            <meta http-equiv="refresh" content="3">
            <style>
                body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; }
                .card { background: #11161D; border: 1px solid #3B82F6; padding: 30px; border-radius: 10px; text-align: center; }
            </style></head>
            <body><div class="card">
                <h3 style="color: #3B82F6;">⚡ Booting EC2 Instance...</h3>
                <p>Redirecting to Web Application...</p>
            </div></body></html>"""
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "running" and public_ip:
            target_url = f"http://{public_ip}/{path}" if path else f"http://{public_ip}/"
            return RedirectResponse(url=target_url)
        else:
            return HTMLResponse(f"<h2>Server status: {state}. Refreshing...</h2><meta http-equiv='refresh' content='2'>", status_code=200)
            
    except Exception as e:
        logger.error(f"aws_web_proxy error: {e}")
        return HTMLResponse(f"<h2>Proxy Error: {str(e)}</h2>", status_code=500)


@router.api_route("/aws-proxy/{instance_id}", methods=["GET", "POST", "OPTIONS"])
@router.api_route("/aws-proxy/{instance_id}/{path:path}", methods=["GET", "POST", "OPTIONS"])
async def aws_web_proxy(instance_id: str, path: str = "", request: Request = None):
    try:
        now = time.time()
        _ec2_last_request[instance_id] = now
        
        database = db.get_db()
        conn = database["cloud_connections"].find_one({"provider": "aws"})
        if not conn:
            return HTMLResponse("<h2>❌ No AWS account connected.</h2>", status_code=400)
            
        creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
        if not creds:
            return HTMLResponse("<h2>❌ AWS Auth Failed.</h2>", status_code=401)
            
        ec2 = get_ec2_client(creds, conn["region"])
        res = ec2.describe_instances(InstanceIds=[instance_id])
        inst = res["Reservations"][0]["Instances"][0]
        state = inst["State"]["Name"]
        public_ip = inst.get("PublicIpAddress")
        
        if state in ["stopped", "stopping"]:
            logger.info(f"🌿 GreenOps: Starting EC2 {instance_id}...")
            ec2.start_instances(InstanceIds=[instance_id])
            html = """<!DOCTYPE html>
            <html><head><title>GreenOps Scale-To-Zero</title>
            <meta http-equiv="refresh" content="4">
            <style>
                body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
                .card { background: #11161D; border: 1px solid #22C55E; padding: 40px; border-radius: 12px; text-align: center; max-width: 480px; box-shadow: 0 0 30px rgba(34,197,94,0.2); }
                .spinner { border: 4px solid #1F2933; border-top: 4px solid #22C55E; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .badge { background: rgba(34,197,94,0.2); color: #22C55E; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            </style></head>
            <body><div class="card">
                <span class="badge">🌱 GreenOps Scale-To-Zero</span>
                <h2 style="margin-top: 15px;">Waking Up Server on AWS...</h2>
                <p style="color: #94A3B8; font-size: 14px;">This server was stopped to save <b>100% energy</b>. Starting EC2...</p>
                <div class="spinner"></div>
                <p style="font-size: 12px; color: #22C55E;">AWS EC2 Starting... Auto-refreshing in 4s.</p>
            </div></body></html>"""
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "pending":
            html = """<!DOCTYPE html>
            <html><head><title>Server Starting...</title>
            <meta http-equiv="refresh" content="3">
            <style>
                body { background: #0B0F14; color: #E2E8F0; font-family: sans-serif; display: flex; height: 100vh; align-items: center; justify-content: center; }
                .card { background: #11161D; border: 1px solid #3B82F6; padding: 30px; border-radius: 10px; text-align: center; }
            </style></head>
            <body><div class="card">
                <h3 style="color: #3B82F6;">⚡ Booting EC2 Instance...</h3>
                <p>Redirecting to Web Application...</p>
            </div></body></html>"""
            return HTMLResponse(content=html, status_code=200)
            
        elif state == "running" and public_ip:
            target_url = f"http://{public_ip}/{path}" if path else f"http://{public_ip}/"
            return RedirectResponse(url=target_url)
        else:
            return HTMLResponse(f"<h2>Server status: {state}. Refreshing...</h2><meta http-equiv='refresh' content='2'>", status_code=200)
            
    except Exception as e:
        logger.error(f"aws_web_proxy error: {e}")
        return HTMLResponse(f"<h2>Proxy Error: {str(e)}</h2>", status_code=500)

