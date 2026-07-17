# ============================================
# GreenOps Backend - Session Routes
# Receives reports from gateway
# ============================================

import logging
from fastapi import APIRouter
from app.schemas import SessionReport
from app import metrics_collector

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/report")
async def receive_session_report(body: SessionReport):
    """
    Called by gateway every few seconds.
    Updates active user count and RPS in backend state.
    """
    metrics_collector.update_active_users(
        active_users=body.active_users,
        total_requests=body.total_requests_in_session
    )

    logger.debug(f"Session report received | users={body.active_users}")

    return {
        "success": True,
        "active_users": body.active_users
    }