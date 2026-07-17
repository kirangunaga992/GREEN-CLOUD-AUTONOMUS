# ============================================
# GreenOps Backend - Sustainability Routes
# ============================================

import logging
from fastapi import APIRouter
from app.energy_meter import get_today_totals
from app import database as db
from app.config import config

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/summary")
async def get_sustainability_summary():
    """
    Returns full sustainability summary.
    Energy, carbon, cost - actual vs saved.
    """
    totals = get_today_totals()

    # Recent energy records for charts
    records = db.find_many(
        collection=config.COL_ENERGY,
        limit=50
    )

    for r in records:
        if "timestamp" in r and hasattr(r["timestamp"], "isoformat"):
            r["timestamp"] = r["timestamp"].isoformat()
        if "created_at" in r:
            del r["created_at"]

    return {
        "success": True,
        "today_totals": totals,
        "history": records,
        "explanation": {
            "baseline": f"Traditional cloud: {config.MAX_REPLICAS} pods always ON at {config.P_IDLE_WATTS}W each",
            "carbon_factor": f"{config.CARBON_FACTOR} kgCO2 per kWh (India grid)",
            "electricity_cost": f"₹{config.ELECTRICITY_COST} per kWh"
        }
    }