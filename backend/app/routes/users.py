# ============================================
# User Auth + Feature Usage Routes
# ============================================

import logging
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from app import auth
from app.config import config

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================
# Request Models
# ============================================
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class FeatureUseRequest(BaseModel):
    feature: str


# ============================================
# Feature Cost Definitions
# Each feature has different resource use
# ============================================
FEATURE_COSTS = {
    "analytics":    {"energy_kwh": 0.0002, "cost_inr": 0.0016, "carbon_kg": 0.00014, "intensity": "light"},
    "ai_compute":   {"energy_kwh": 0.0008, "cost_inr": 0.0064, "carbon_kg": 0.00057, "intensity": "heavy"},
    "file_storage": {"energy_kwh": 0.0001, "cost_inr": 0.0008, "carbon_kg": 0.00007, "intensity": "light"},
    "email":        {"energy_kwh": 0.0001, "cost_inr": 0.0008, "carbon_kg": 0.00007, "intensity": "light"},
    "video":        {"energy_kwh": 0.0010, "cost_inr": 0.0080, "carbon_kg": 0.00071, "intensity": "heavy"},
}


# ============================================
# Auth Endpoints
# ============================================
@router.post("/register")
async def register(body: RegisterRequest):
    """Register new user"""
    if len(body.password) < 4:
        raise HTTPException(status_code=400, detail="Password too short (min 4 chars)")
    if len(body.name) < 2:
        raise HTTPException(status_code=400, detail="Name too short")

    result = auth.register_user(body.name, body.email, body.password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/login")
async def login(body: LoginRequest):
    """Login user"""
    result = auth.login_user(body.email, body.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])
    return result


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")
    token = authorization.replace("Bearer ", "")
    return auth.logout_user(token)


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """Get current user info"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No token")
    token = authorization.replace("Bearer ", "")
    user = auth.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"success": True, "user": user}


# ============================================
# Feature Usage
# ============================================
@router.post("/use-feature")
async def use_feature(
    body: FeatureUseRequest,
    authorization: Optional[str] = Header(None)
):
    """Record feature usage by user"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Login required")

    token = authorization.replace("Bearer ", "")
    user = auth.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    if body.feature not in FEATURE_COSTS:
        raise HTTPException(status_code=400, detail="Unknown feature")

    costs = FEATURE_COSTS[body.feature]
    auth.record_feature_usage(
        user_id=user["user_id"],
        feature=body.feature,
        energy_kwh=costs["energy_kwh"],
        cost_inr=costs["cost_inr"],
        carbon_kg=costs["carbon_kg"]
    )

    logger.info(f"Feature used | user={user['name']} | feature={body.feature}")

    return {
        "success": True,
        "message": f"Used {body.feature}",
        "cost": costs,
        "intensity": costs["intensity"]
    }


# ============================================
# Admin Endpoints (list all users)
# ============================================
@router.get("/all")
async def get_all_users():
    """Get all users - for admin dashboard"""
    users = auth.get_all_users()
    online_unique = sum(1 for u in users if u.get("is_online"))
    total_sessions = auth.get_active_sessions_count()

    return {
        "success": True,
        "count": len(users),
        "online_count": online_unique,          # UNIQUE users online
        "active_sessions": total_sessions,       # Total sessions (can be > online_count)
        "users": users
    }


@router.get("/{user_id}/activity")
async def get_user_activity(user_id: str, limit: int = 100):
    """Get activity timeline for a user"""
    user = auth.get_user_details(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    activity = auth.get_user_activity(user_id, limit)
    summary = auth.get_user_activity_summary(user_id)

    return {
        "success": True,
        "user": user,
        "activity": activity,
        "summary": summary
    }


@router.get("/{user_id}")
async def get_user_detail(user_id: str):
    """Get specific user details"""
    user = auth.get_user_details(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": user}
