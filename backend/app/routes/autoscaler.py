# ============================================
# AWS Auto-Scaler & Notifications
# Automatically scale up/down based on traffic
# ============================================
import logging
import boto3
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Body, Header, HTTPException
from app import database as db
from app.routes.auth import verify_jwt
from app.routes.cloud import assume_customer_role, get_service_clients
from app.routes.auth import send_email

logger = logging.getLogger(__name__)
router = APIRouter()

# Thresholds
IDLE_CPU_THRESHOLD = 5.0     # Below 5% CPU = idle
SCALE_UP_THRESHOLD = 80.0     # Above 80% CPU = scale up
IDLE_MINUTES = 15             # Idle for 15 min = shutdown
CHECK_INTERVAL = 300          # Check every 5 min


def get_current_user(auth_header):
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = verify_jwt(auth_header.replace("Bearer ", ""))
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


def get_instance_cpu(clients, instance_id):
    """Get CPU usage for last 15 minutes."""
    try:
        metrics = clients["cloudwatch"].get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=datetime.now(timezone.utc) - timedelta(minutes=IDLE_MINUTES),
            EndTime=datetime.now(timezone.utc),
            Period=300,  # 5 min buckets
            Statistics=['Average']
        )
        datapoints = metrics.get('Datapoints', [])
        if not datapoints:
            return 0
        avg = sum(dp['Average'] for dp in datapoints) / len(datapoints)
        return round(avg, 2)
    except Exception as e:
        logger.error(f"CPU fetch error: {e}")
        return 0


def get_network_traffic(clients, instance_id):
    """Get network traffic for last 15 min."""
    try:
        metrics = clients["cloudwatch"].get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='NetworkIn',
            Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
            StartTime=datetime.now(timezone.utc) - timedelta(minutes=IDLE_MINUTES),
            EndTime=datetime.now(timezone.utc),
            Period=300,
            Statistics=['Sum']
        )
        datapoints = metrics.get('Datapoints', [])
        if not datapoints:
            return 0
        total = sum(dp['Sum'] for dp in datapoints)
        return round(total / 1024, 2)  # KB
    except:
        return 0



def detect_web_server(clients, instance_id, instance):
    """Detect if instance is running a web server that shouldn't be stopped."""
    warnings = []
    is_web_server = False
    
    # Check 1: Security group has web ports (80, 443, 8080)
    try:
        sg_ids = [sg["GroupId"] for sg in instance.get("SecurityGroups", [])]
        if sg_ids:
            sg_response = clients["ec2"].describe_security_groups(GroupIds=sg_ids)
            for sg in sg_response.get("SecurityGroups", []):
                for rule in sg.get("IpPermissions", []):
                    from_port = rule.get("FromPort")
                    if from_port in [80, 443, 8080, 8443, 3000, 5000, 8000]:
                        is_web_server = True
                        warnings.append(f"Port {from_port} is open (web traffic)")
    except Exception as e:
        pass
    
    # Check 2: Has Elastic IP (usually means public web app)
    if instance.get("PublicIpAddress"):
        is_web_server = True
        warnings.append(f"Has public IP: {instance.get('PublicIpAddress')} (public access)")
    
    # Check 3: Has "web", "app", "prod", "production" in name
    for tag in instance.get("Tags", []):
        if tag["Key"] == "Name":
            name = tag['Value'].lower()
            if any(kw in name for kw in ["web", "app", "prod", "production", "www", "api"]):
                is_web_server = True
                warnings.append(f"Name suggests production: '{tag['Value']}'")
    
    # Check 4: Look for tags indicating environment
    for tag in instance.get("Tags", []):
        if tag["Key"].lower() in ["environment", "env", "stage"]:
            if tag['Value'].lower() in ["production", "prod", "live"]:
                is_web_server = True
                warnings.append(f"Tagged as: {tag['Key']}={tag['Value']}")
    
    return {
        "is_production_web": is_web_server,
        "warnings": warnings,
        "safe_to_stop": not is_web_server,
        "recommendation": "MONITOR ONLY - never auto-shutdown" if is_web_server else "SAFE to auto-shutdown"
    }



@router.post("/analyze")
async def analyze_instances(authorization: str = Header(None)):
    """Analyze all instances and get recommendations."""
    try:
        user = get_current_user(authorization)
        database = db.get_db()
        
        connections = list(database["cloud_connections"].find(
            {"user_id": user["user_id"], "provider": "aws"}
        ))
        
        if not connections:
            return {"success": False, "error": "No AWS accounts connected for your logged-in user. Please go to Cloud Providers and click Connect AWS."}
        
        user_data = database["users"].find_one({"user_id": user["user_id"]})
        user_email = user_data.get("email") if user_data else None
        user_name = user_data.get("name", "User") if user_data else "User"
        
        recommendations = []
        alerts = []
        
        for conn in connections:
            creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
            if not creds:
                continue
            
            clients = get_service_clients(creds, conn["region"])
            
            # Get all EC2 instances
            response = clients["ec2"].describe_instances()
            
            for r in response.get("Reservations", []):
                for inst in r.get("Instances", []):
                    state = inst.get("State", {}).get("Name")
                    instance_id = inst.get("InstanceId")
                    itype = inst.get("InstanceType", "unknown")
                    
                    # Get name tag
                    name = "unnamed"
                    for tag in inst.get("Tags", []):
                        if tag["Key"] == "Name":
                            name = tag['Value']
                    
                    if state == "running":
                        # Check CPU and network
                        cpu = get_instance_cpu(clients, instance_id)
                        network = get_network_traffic(clients, instance_id)
                        
                        rec = {
                            "account": conn["account_name"],
                            "instance_id": instance_id,
                            "name": name,
                            "type": itype,
                            "state": state,
                            "cpu_avg": cpu,
                            "network_kb": network,
                            "region": conn["region"]
                        }
                        
                        # DECISION LOGIC
                        # Check if this is a production web server
                        web_check = detect_web_server(clients, instance_id, inst)
                        rec["is_production_web"] = web_check["is_production_web"]
                        rec["safety_warnings"] = web_check["warnings"]
                        
                        if cpu < IDLE_CPU_THRESHOLD and network < 100:
                            # IDLE - recommend shutdown
                            if web_check["is_production_web"]:
                                rec["recommendation"] = "monitor_only"
                                rec["reason"] = "IDLE but appears to be PRODUCTION WEB SERVER - Do NOT auto-stop"
                                rec["safety_note"] = "This instance may host a live website. Manual review required."
                            else:
                                rec["recommendation"] = "shutdown"
                            rec["reason"] = f"Idle for {IDLE_MINUTES} min (CPU: {cpu}%, Network: {network}KB)"
                            rec["potential_saving_monthly"] = round(0.0104 * 24 * 30, 2)
                            rec["carbon_saving_monthly_kg"] = round(0.005 * 24 * 30, 2)
                            
                            alerts.append({
                                "type": "idle_instance",
                                "severity": "warning",
                                "instance": name,
                                "instance_id": instance_id,
                                "message": f"{name} has been idle for {IDLE_MINUTES}+ minutes",
                                "recommendation": "Auto-shutdown to save $7.49/month + 3.17kg CO2/month",
                                "cpu": cpu,
                                "network_kb": network
                            })
                        
                        elif cpu > SCALE_UP_THRESHOLD:
                            # HIGH LOAD - recommend scale up
                            rec["recommendation"] = "scale_up"
                            rec["reason"] = f"High CPU load ({cpu}%)"
                            
                            alerts.append({
                                "type": "high_load",
                                "severity": "critical",
                                "instance": name,
                                "instance_id": instance_id,
                                "message": f"{name} is under high load ({cpu}% CPU)",
                                "recommendation": "Scale up: launch additional instance"
                            })
                        
                        else:
                            rec["recommendation"] = "healthy"
                            rec["reason"] = f"Normal usage ({cpu}% CPU)"
                        
                        recommendations.append(rec)
                    
                    elif state == "stopped":
                        # Stopped - check if should stay stopped
                        recommendations.append({
                            "account": conn["account_name"],
                            "instance_id": instance_id,
                            "name": name,
                            "type": itype,
                            "state": state,
                            "recommendation": "keep_stopped",
                            "reason": "Currently stopped - saving 100% cost & carbon",
                            "region": conn["region"]
                        })
        
        # Send email if there are alerts
        if alerts and user_email:
            try:
                alert_html = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F14; color: #e2e8f0; padding: 40px; border-radius: 8px;">
                    <h1 style="color: #EF4444;">🚨 GreenOps Alerts</h1>
                    <p>Hi {user_name},</p>
                    <p>Your GreenOps auto-scaler detected the following issues:</p>
                    <div style="margin: 20px 0;">
                """
                for alert in alerts:
                    color = "#EF4444" if alert["severity"] == "critical" else "#FACC15"
                    alert_html += f"""
                    <div style="background: #171C23; border-left: 4px solid {color}; padding: 15px; margin: 10px 0; border-radius: 4px;">
                        <p style="color: {color}; font-weight: bold; margin: 0;">{alert['severity'].upper()}: {alert['type']}</p>
                        <p style="margin: 5px 0; color: white;">{alert['message']}</p>
                        <p style="margin: 5px 0; font-size: 12px; color: #94a3b8;">💡 {alert['recommendation']}</p>
                    </div>
                    """
                
                alert_html += """
                    </div>
                    <a href="http://localhost:3000/inventory" style="display: inline-block; background: #22C55E; color: #0B0F14; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">View Dashboard →</a>
                    <hr style="border: 1px solid #1F2933; margin: 30px 0;">
                    <p style="color: #64748b; font-size: 12px;">GreenOps Autonomous — Sustainable Cloud Platform</p>
                </div>
                """
                
                send_email(user_email, f"🚨 GreenOps: {len(alerts)} Alert(s) - Action Required", alert_html)
                logger.info(f"Alert email sent to {user_email}")
            except Exception as e:
                logger.error(f"Email alert failed: {e}")
        
        # Log to MongoDB
        database["autoscaler_events"].insert_one({
            "user_id": user["user_id"],
            "timestamp": datetime.now(timezone.utc),
            "recommendations": recommendations,
            "alerts": alerts,
            "total_instances": len(recommendations),
            "idle_count": len([r for r in recommendations if r.get("recommendation") == "shutdown"]),
            "healthy_count": len([r for r in recommendations if r.get("recommendation") == "healthy"]),
        })
        
        return {
            "success": True,
            "recommendations": recommendations,
            "alerts": alerts,
            "total_instances": len(recommendations),
            "alerts_sent": len(alerts) > 0 and user_email is not None
        }
    
    except Exception as e:
        logger.error(f"analyze error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/execute-shutdown")
async def execute_shutdown(payload: dict = Body(...), authorization: str = Header(None)):
    """Actually stop an idle instance."""
    try:
        user = get_current_user(authorization)
        instance_id = payload.get("instance_id")
        account_name = payload.get("account_name")
        
        database = db.get_db()
        conn = database["cloud_connections"].find_one({
            "user_id": user["user_id"],
            "account_name": account_name
        })
        
        if not conn:
            return {"success": False, "error": "Account not found"}
        
        creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
        if not creds:
            return {"success": False, "error": "Failed to assume role"}
        
        ec2 = boto3.client('ec2',
            aws_access_key_id=creds['AccessKeyId'],
            aws_secret_access_key=creds['SecretAccessKey'],
            aws_session_token=creds['SessionToken'],
            region_name=conn['region']
        )
        
        response = ec2.stop_instances(InstanceIds=[instance_id])
        
        # Log action
        database["autoscaler_actions"].insert_one({
            "user_id": user["user_id"],
            "timestamp": datetime.now(timezone.utc),
            "action": "shutdown",
            "instance_id": instance_id,
            "account_name": account_name,
            "reason": "Auto-shutdown due to idle state"
        })
        
        # Notify user
        user_data = database["users"].find_one({"user_id": user["user_id"]})
        if user_data and user_data.get("email"):
            confirm_html = f"""
            <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #0B0F14; color: #e2e8f0; padding: 40px; border-radius: 8px;">
                <h1 style="color: #22C55E;">✅ Instance Stopped</h1>
                <p>Hi {user_data.get('name', 'User')},</p>
                <p>Instance <strong style="color: white;">{instance_id}</strong> was automatically stopped due to being idle.</p>
                <div style="background: #22C55E10; border: 1px solid #22C55E; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="color: #22C55E; font-weight: bold; margin: 0;">💰 Savings:</p>
                    <p style="margin: 5px 0;">$7.49/month saved</p>
                    <p style="margin: 5px 0;">3.17kg CO2/month prevented</p>
                </div>
                <p>You can restart it anytime from the AWS Console or GreenOps dashboard.</p>
            </div>
            """
            send_email(user_data["email"], "✅ GreenOps: Instance Auto-Stopped (Cost Saved)", confirm_html)
        
        return {
            "success": True,
            "message": f"Instance {instance_id} stopped successfully",
            "state": response['StoppingInstances'][0]['CurrentState']['Name']
        }
    
    except Exception as e:
        logger.error(f"shutdown error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.post("/execute-start")
async def execute_start(payload: dict = Body(...), authorization: str = Header(None)):
    """Start a stopped instance."""
    try:
        user = get_current_user(authorization)
        instance_id = payload.get("instance_id")
        account_name = payload.get("account_name")
        
        database = db.get_db()
        conn = database["cloud_connections"].find_one({
            "user_id": user["user_id"],
            "account_name": account_name
        })
        
        if not conn:
            return {"success": False, "error": "Account not found"}
        
        creds = assume_customer_role(conn["role_arn"], conn.get("external_id"))
        
        ec2 = boto3.client('ec2',
            aws_access_key_id=creds['AccessKeyId'],
            aws_secret_access_key=creds['SecretAccessKey'],
            aws_session_token=creds['SessionToken'],
            region_name=conn['region']
        )
        
        response = ec2.start_instances(InstanceIds=[instance_id])
        
        database["autoscaler_actions"].insert_one({
            "user_id": user["user_id"],
            "timestamp": datetime.now(timezone.utc),
            "action": "start",
            "instance_id": instance_id,
            "account_name": account_name,
            "reason": "Manual start via GreenOps"
        })
        
        return {"success": True, "message": f"Instance {instance_id} starting"}
    
    except Exception as e:
        logger.error(f"start error: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@router.get("/history")
async def get_autoscaler_history(authorization: str = Header(None)):
    """Get history of autoscaler actions."""
    try:
        user = get_current_user(authorization)
        database = db.get_db()
        
        events = list(database["autoscaler_events"].find(
            {"user_id": user["user_id"]},
            {"_id": 0}
        ).sort("timestamp", -1).limit(20))
        
        actions = list(database["autoscaler_actions"].find(
            {"user_id": user["user_id"]},
            {"_id": 0}
        ).sort("timestamp", -1).limit(50))
        
        for event in events:
            if isinstance(event.get("timestamp"), datetime):
                event["timestamp"] = event["timestamp"].isoformat()
        for action in actions:
            if isinstance(action.get("timestamp"), datetime):
                action["timestamp"] = action["timestamp"].isoformat()
        
        return {
            "success": True,
            "events": events,
            "actions": actions,
            "total_shutdowns": len([a for a in actions if a.get("action") == "shutdown"]),
            "total_starts": len([a for a in actions if a.get("action") == "start"]),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
