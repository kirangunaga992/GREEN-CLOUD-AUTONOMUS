# ============================================
# GreenOps - User Authentication
# ============================================

import hashlib
import secrets
import logging
from datetime import datetime, timezone
from app import database as db
from app.config import config

logger = logging.getLogger(__name__)

USERS_COLLECTION = "users"
SESSIONS_COLLECTION = "user_sessions"
ACTIVITY_COLLECTION = "user_activity"

def hash_password(password: str) -> str:
    """Simple SHA256 hash - fine for demo"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Generate secure random token"""
    return secrets.token_urlsafe(32)

def register_user(name: str, email: str, password: str) -> dict:
    """Register a new user"""
    database = db.get_db()

    # Check if email already exists
    existing = database[USERS_COLLECTION].find_one({"email": email.lower()})
    if existing:
        return {"success": False, "error": "Email already registered"}

    user = {
        "user_id": secrets.token_hex(8),
        "name": name.strip(),
        "email": email.lower().strip(),
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc),

        # Usage tracking
        "total_requests": 0,
        "total_energy_kwh": 0.0,
        "total_carbon_kg": 0.0,
        "total_cost_inr": 0.0,

        # Feature usage counts
        "features_used": {
            "analytics": 0,
            "ai_compute": 0,
            "file_storage": 0,
            "email": 0,
            "video": 0
        },

        # Status
        "is_online": False,
        "last_login": None
    }

    database[USERS_COLLECTION].insert_one(user)
    logger.info(f"User registered | name={name} | email={email}")

    # Return user without password
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"success": True, "user": user}


def login_user(email: str, password: str) -> dict:
    """Login user, return token"""
    database = db.get_db()

    user = database[USERS_COLLECTION].find_one({"email": email.lower()})
    if not user:
        return {"success": False, "error": "Invalid email or password"}

    if user["password_hash"] != hash_password(password):
        return {"success": False, "error": "Invalid email or password"}

    # Generate session token
    token = generate_token()
    session = {
        "token": token,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "created_at": datetime.now(timezone.utc),
        "last_activity": datetime.now(timezone.utc),
        "is_active": True
    }
    database[SESSIONS_COLLECTION].insert_one(session)

    # Update user online status
    database[USERS_COLLECTION].update_one(
        {"user_id": user["user_id"]},
        {"$set": {"is_online": True, "last_login": datetime.now(timezone.utc)}}
    )

    logger.info(f"User logged in | name={user['name']}")

    user.pop("password_hash", None)
    user.pop("_id", None)

    return {
        "success": True,
        "token": token,
        "user": user
    }


def logout_user(token: str) -> dict:
    """Logout user - only mark offline if NO other active sessions"""
    database = db.get_db()

    session = database[SESSIONS_COLLECTION].find_one({"token": token})
    if session:
        # Deactivate this session
        database[SESSIONS_COLLECTION].update_one(
            {"token": token},
            {"$set": {"is_active": False}}
        )

        # Check if user has any OTHER active sessions
        other_sessions = database[SESSIONS_COLLECTION].count_documents({
            "user_id": session["user_id"],
            "token": {"$ne": token},
            "is_active": True
        })

        # Only mark offline if this was the LAST device
        if other_sessions == 0:
            database[USERS_COLLECTION].update_one(
                {"user_id": session["user_id"]},
                {"$set": {"is_online": False}}
            )
            logger.info(f"User logged out (last device) | user={session['user_name']}")
        else:
            logger.info(f"User logged out (still on {other_sessions} device(s)) | user={session['user_name']}")

    return {"success": True}


def get_user_by_token(token: str) -> dict:
    """Get user from token"""
    database = db.get_db()

    session = database[SESSIONS_COLLECTION].find_one({
        "token": token,
        "is_active": True
    })
    if not session:
        return None

    user = database[USERS_COLLECTION].find_one({"user_id": session["user_id"]})
    if user:
        user.pop("password_hash", None)
        user.pop("_id", None)

        # Update last activity
        database[SESSIONS_COLLECTION].update_one(
            {"token": token},
            {"$set": {"last_activity": datetime.now(timezone.utc)}}
        )
    return user


def record_feature_usage(user_id: str, feature: str, energy_kwh: float, cost_inr: float, carbon_kg: float):
    """Record when user uses a feature"""
    from datetime import datetime, timezone
    database = db.get_db()

    # Update user totals
    database[USERS_COLLECTION].update_one(
        {"user_id": user_id},
        {
            "$inc": {
                "total_requests": 1,
                f"features_used.{feature}": 1,
                "total_energy_kwh": energy_kwh,
                "total_carbon_kg": carbon_kg,
                "total_cost_inr": cost_inr
            }
        }
    )

    # Log activity for timeline chart
    database[ACTIVITY_COLLECTION].insert_one({
        "user_id": user_id,
        "feature": feature,
        "timestamp": datetime.now(timezone.utc),
        "energy_kwh": energy_kwh,
        "cost_inr": cost_inr,
        "carbon_kg": carbon_kg
    })


def get_user_activity(user_id: str, limit: int = 100) -> list:
    """Get recent activity log for a user"""
    database = db.get_db()
    activity = list(database[ACTIVITY_COLLECTION].find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit))

    for a in activity:
        if "timestamp" in a and hasattr(a["timestamp"], "isoformat"):
            a["timestamp"] = a["timestamp"].isoformat()

    return list(reversed(activity))  # Oldest first for chart


def get_user_activity_summary(user_id: str) -> dict:
    """Get aggregated activity stats"""
    from datetime import datetime, timezone, timedelta
    database = db.get_db()

    # Last 24 hours activity count
    last_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    last_hour = datetime.now(timezone.utc) - timedelta(hours=1)

    return {
        "actions_last_24h": database[ACTIVITY_COLLECTION].count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": last_24h}
        }),
        "actions_last_hour": database[ACTIVITY_COLLECTION].count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": last_hour}
        }),
        "total_actions": database[ACTIVITY_COLLECTION].count_documents({
            "user_id": user_id
        })
    }


def get_all_users() -> list:
    """Get all users (for admin) - includes device count"""
    database = db.get_db()
    users = list(database[USERS_COLLECTION].find({}, {"password_hash": 0, "_id": 0}))

    for u in users:
        # Format dates
        if "created_at" in u:
            u["created_at"] = u["created_at"].isoformat() if hasattr(u["created_at"], "isoformat") else str(u["created_at"])
        if "last_login" in u and u["last_login"]:
            u["last_login"] = u["last_login"].isoformat() if hasattr(u["last_login"], "isoformat") else str(u["last_login"])

        # Count active devices for this user
        device_count = database[SESSIONS_COLLECTION].count_documents({
            "user_id": u["user_id"],
            "is_active": True
        })
        u["active_devices"] = device_count

    return users


def get_user_details(user_id: str) -> dict:
    """Get detailed user info"""
    database = db.get_db()
    user = database[USERS_COLLECTION].find_one({"user_id": user_id}, {"password_hash": 0, "_id": 0})
    if user:
        if "created_at" in user:
            user["created_at"] = user["created_at"].isoformat() if hasattr(user["created_at"], "isoformat") else str(user["created_at"])
        if "last_login" in user and user["last_login"]:
            user["last_login"] = user["last_login"].isoformat() if hasattr(user["last_login"], "isoformat") else str(user["last_login"])
    return user


def get_online_users_count() -> int:
    """Count of UNIQUE online users (not sessions)"""
    database = db.get_db()
    # Count distinct user_ids that are online
    return database[USERS_COLLECTION].count_documents({"is_online": True})


def get_active_sessions_count() -> int:
    """Count total active sessions (can be multiple per user)"""
    database = db.get_db()
    return database[SESSIONS_COLLECTION].count_documents({"is_active": True})
