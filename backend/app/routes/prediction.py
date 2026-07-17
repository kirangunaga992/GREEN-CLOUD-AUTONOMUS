# ============================================
# GreenOps Backend - Prediction Routes
# ============================================

import logging
from fastapi import APIRouter
from app import predictor
from app import database as db
from app.config import config

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/forecast")
async def get_forecast():
    """
    Runs Prophet/moving-average prediction
    and returns forecast for next 5 minutes.
    """
    try:
        result = predictor.run_prediction()

        if "timestamp" in result and hasattr(result["timestamp"], "isoformat"):
            result["timestamp"] = result["timestamp"].isoformat()

        return {"success": True, "data": result}

    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        return {"success": False, "error": str(e)}


@router.get("/history")
async def get_prediction_history(limit: int = 10):
    """
    Returns recent prediction results from MongoDB.
    """
    records = db.find_many(
        collection=config.COL_PREDICTIONS,
        limit=limit
    )

    for r in records:
        if "timestamp" in r and hasattr(r["timestamp"], "isoformat"):
            r["timestamp"] = r["timestamp"].isoformat()
        if "created_at" in r:
            del r["created_at"]

    return {"success": True, "data": records}