# ============================================
# GreenOps Backend - Metrics Routes
# ============================================

import logging
from fastapi import APIRouter, Query
from app import database as db
from app import metrics_collector
from app.config import config

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/live")
async def get_live_metrics():
    """
    Returns current live metrics snapshot.
    """
    state = metrics_collector.get_current_state()
    return {"success": True, "data": state}


@router.get("/history")
async def get_metrics_history(
    limit: int = Query(default=50, ge=1, le=200)
):
    """
    Returns historical metrics from MongoDB.
    Used for charts on the dashboard.
    """
    records = db.find_many(
        collection=config.COL_METRICS,
        limit=limit
    )

    # Convert timestamps to ISO strings
    for r in records:
        if "timestamp" in r and hasattr(r["timestamp"], "isoformat"):
            r["timestamp"] = r["timestamp"].isoformat()
        if "created_at" in r:
            del r["created_at"]

    return {
        "success": True,
        "count": len(records),
        "data": records
    }