
# ============================================
# User Services Selection & Consumption
# ============================================
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Body
from app import database as db

logger = logging.getLogger(__name__)
router = APIRouter()

SERVICES = [
    {"id": "analytics", "name": "Analytics Server", "description": "Big data analytics", "icon": "chart", "cost_per_hour": 0.05, "carbon_per_hour": 45, "power_watts": 60, "color": "blue", "max_concurrent": 3},
    {"id": "ai_compute", "name": "AI Compute Server", "description": "ML inference", "icon": "cpu", "cost_per_hour": 0.20, "carbon_per_hour": 90, "power_watts": 120, "color": "purple", "max_concurrent": 2},
    {"id": "file_storage", "name": "File Storage Server", "description": "Cloud storage", "icon": "database", "cost_per_hour": 0.02, "carbon_per_hour": 20, "power_watts": 30, "color": "green", "max_concurrent": 5},
    {"id": "email", "name": "Email Service", "description": "SMTP delivery", "icon": "mail", "cost_per_hour": 0.01, "carbon_per_hour": 15, "power_watts": 20, "color": "yellow", "max_concurrent": 10},
    {"id": "video", "name": "Video Streaming", "description": "Video CDN", "icon": "video", "cost_per_hour": 0.15, "carbon_per_hour": 80, "power_watts": 100, "color": "red", "max_concurrent": 2},
    {"id": "database", "name": "Database Server", "description": "SQL storage", "icon": "server", "cost_per_hour": 0.08, "carbon_per_hour": 50, "power_watts": 70, "color": "cyan", "max_concurrent": 4},
]


@router.get("/catalog")
async def get_services_catalog():
    return {"services": SERVICES}


@router.get("/active")
async def get_all_active_services():
    try:
        database = db.get_db()
        users = list(database["users"].find(
            {"is_online": True},
            {"user_id": 1, "name": 1, "active_services": 1, "_id": 0}
        ))
        service_usage = {}
        for svc in SERVICES:
            service_usage[svc["id"]] = {**svc, "users": []}
        for u in users:
            for svc_id in u.get("active_services", []):
                if svc_id in service_usage:
                    service_usage[svc_id]["users"].append({
                        "user_id": u.get("user_id"),
                        "name": u.get("name")
                    })
        return {
            "success": True,
            "services": list(service_usage.values()),
            "total_online_users": len(users)
        }
    except Exception as e:
        logger.error(f"active services error: {e}")
        return {"success": False, "error": str(e)}


@router.post("/toggle")
async def toggle_service(payload: dict = Body(...)):
    try:
        user_id = payload.get("user_id")
        service_id = payload.get("service_id")
        enable = bool(payload.get("enable", True))
        if not user_id or not service_id:
            return {"success": False, "error": "user_id and service_id required"}
        service = next((s for s in SERVICES if s["id"] == service_id), None)
        if not service:
            return {"success": False, "error": "Unknown service"}
        database = db.get_db()
        user = database["users"].find_one({"user_id": user_id})
        if not user:
            return {"success": False, "error": "User not found"}
        active = set(user.get("active_services", []))
        if enable:
            active.add(service_id)
        else:
            active.discard(service_id)
        database["users"].update_one(
            {"user_id": user_id},
            {"$set": {
                "active_services": list(active),
                "services_updated_at": datetime.now(timezone.utc)
            }}
        )
        return {
            "success": True,
            "user_id": user_id,
            "active_services": list(active),
            "action": "enabled" if enable else "disabled"
        }
    except Exception as e:
        logger.error(f"toggle service error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/user/{user_id}")
async def get_user_services(user_id: str):
    try:
        database = db.get_db()
        user = database["users"].find_one({"user_id": user_id})
        if not user:
            return {"success": False, "error": "User not found"}
        active_ids = user.get("active_services", [])
        active_services = [s for s in SERVICES if s["id"] in active_ids]
        total_cost = sum(s["cost_per_hour"] for s in active_services)
        total_carbon = sum(s["carbon_per_hour"] for s in active_services)
        total_power = sum(s["power_watts"] for s in active_services)
        return {
            "success": True,
            "user_id": user_id,
            "name": user.get("name"),
            "active_services": active_services,
            "total_cost_per_hour": round(total_cost, 3),
            "total_carbon_per_hour": total_carbon,
            "total_power_watts": total_power
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================
# Request Simulation with Failures
# ============================================
import random
import time

# In-memory request stats (per service)
_request_stats = {}
_stats_lock = None

def _init_stats():
    for svc in SERVICES:
        if svc["id"] not in _request_stats:
            _request_stats[svc["id"]] = {
                "success": 0,
                "failed": 0,
                "total": 0,
                "last_failures": []  # recent failures with user + time
            }

_init_stats()


@router.post("/request")
async def make_service_request(payload: dict = Body(...)):
    """
    User sends a request to a service.
    May succeed or fail based on current load vs capacity.
    """
    try:
        user_id = payload.get("user_id")
        service_id = payload.get("service_id")
        
        if not user_id or not service_id:
            return {"success": False, "error": "user_id and service_id required"}
        
        service = next((s for s in SERVICES if s["id"] == service_id), None)
        if not service:
            return {"success": False, "error": "Unknown service"}
        
        database = db.get_db()
        user = database["users"].find_one({"user_id": user_id})
        if not user:
            return {"success": False, "error": "User not found"}
        
        # Count concurrent users on this service
        online_users_using = database["users"].count_documents({
            "is_online": True,
            "active_services": service_id
        })
        
        max_cap = service.get("max_concurrent", 5)
        _init_stats()
        stats = _request_stats[service_id]
        stats["total"] += 1
        
        # Failure logic:
        # - If concurrent users >= max capacity → fail
        # - Add some randomness for realism (5% baseline error rate)
        overloaded = online_users_using > max_cap
        random_fail = random.random() < 0.05
        
        if overloaded or random_fail:
            stats["failed"] += 1
            reason = "Server overloaded" if overloaded else "Network timeout"
            stats["last_failures"].append({
                "user_id": user_id,
                "user_name": user.get("name"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reason": reason
            })
            # Keep only last 20 failures
            stats["last_failures"] = stats["last_failures"][-20:]
            
            # Log to MongoDB for persistence
            database["failed_requests"].insert_one({
                "user_id": user_id,
                "user_name": user.get("name"),
                "service_id": service_id,
                "service_name": service["name"],
                "reason": reason,
                "concurrent_users": online_users_using,
                "capacity": max_cap,
                "timestamp": datetime.now(timezone.utc)
            })
            
            return {
                "success": False,
                "status": 503,
                "error": reason,
                "service": service_id,
                "concurrent_users": online_users_using,
                "capacity": max_cap
            }
        else:
            stats["success"] += 1
            return {
                "success": True,
                "status": 200,
                "service": service_id,
                "concurrent_users": online_users_using
            }
    except Exception as e:
        logger.error(f"service request error: {e}")
        return {"success": False, "error": str(e)}


@router.get("/stats")
async def get_service_stats():
    """Get request success/failure stats per service."""
    try:
        _init_stats()
        database = db.get_db()
        
        results = []
        for svc in SERVICES:
            stats = _request_stats.get(svc["id"], {"success": 0, "failed": 0, "total": 0, "last_failures": []})
            total = stats["total"]
            failed = stats["failed"]
            success_rate = ((total - failed) / total * 100) if total > 0 else 100
            
            # Concurrent users right now
            concurrent = database["users"].count_documents({
                "is_online": True,
                "active_services": svc["id"]
            })
            
            results.append({
                "id": svc["id"],
                "name": svc["name"],
                "color": svc["color"],
                "capacity": svc.get("max_concurrent", 5),
                "concurrent_users": concurrent,
                "success": stats["success"],
                "failed": failed,
                "total": total,
                "success_rate": round(success_rate, 1),
                "overloaded": concurrent > svc.get("max_concurrent", 5),
                "recent_failures": stats["last_failures"][-5:]
            })
        
        # Overall stats
        total_all = sum(s["total"] for s in results)
        failed_all = sum(s["failed"] for s in results)
        
        return {
            "success": True,
            "services": results,
            "total_requests": total_all,
            "total_failed": failed_all,
            "overall_success_rate": round(((total_all - failed_all) / total_all * 100), 1) if total_all > 0 else 100
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/failures/recent")
async def get_recent_failures():
    """Get last 20 failed requests from MongoDB."""
    try:
        database = db.get_db()
        failures = list(database["failed_requests"]
                       .find({}, {"_id": 0})
                       .sort("timestamp", -1)
                       .limit(20))
        for f in failures:
            if isinstance(f.get("timestamp"), datetime):
                f["timestamp"] = f["timestamp"].isoformat()
        return {"success": True, "failures": failures}
    except Exception as e:
        return {"success": False, "error": str(e)}

