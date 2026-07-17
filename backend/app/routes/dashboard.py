# ============================================
# GreenOps Backend - Dashboard Routes
# Returns summary data for the frontend
# ============================================

import logging
from datetime import datetime, timezone
from fastapi import APIRouter
from app import metrics_collector
from app.energy_meter import get_today_totals
from app import database as db
from app.config import config

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/summary")
async def get_dashboard_summary():
    """
    Main dashboard summary endpoint.
    Frontend polls this every 5 seconds.
    Returns all KPI data in one call.
    """
    try:
        # Current state
        state = metrics_collector.get_current_state()

        # Today's sustainability totals
        totals = get_today_totals()

        # Last scaling event
        last_scaling = db.get_latest(config.COL_SCALING)
        if last_scaling and "timestamp" in last_scaling:
            if hasattr(last_scaling["timestamp"], "isoformat"):
                last_scaling["timestamp"] = last_scaling[
                    "timestamp"
                ].isoformat()

        # Workload status
        workload_status = (
            "ON" if state["current_replicas"] > 0 else "OFF"
        )

        return {
            "success": True,
            "data": {
                "active_users":         state["active_users"],
                "current_rps":          state["current_rps"],
                "cpu_percent":          state["cpu_percent"],
                "memory_percent":       state["memory_percent"],
                "current_replicas":     state["current_replicas"],
                "workload_status":      workload_status,
                "energy_kwh_today":     totals["energy_kwh_today"],
                "carbon_kg_today":      totals["carbon_kg_today"],
                "carbon_saved_kg_today": totals["carbon_saved_kg_today"],
                "cost_saved_inr_today": totals["cost_saved_inr_today"],
                "saved_energy_kwh_today": totals["saved_energy_kwh_today"],
                "last_scaling_action":  last_scaling,
                "timestamp":            datetime.now(timezone.utc).isoformat()
            }
        }

    except Exception as e:
        logger.error(f"Dashboard summary error: {str(e)}")
        return {"success": False, "error": str(e)}, 500