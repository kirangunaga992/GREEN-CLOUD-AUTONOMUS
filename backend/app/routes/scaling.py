# ============================================
# GreenOps Backend - Scaling Routes
# ============================================

import logging
from fastapi import APIRouter, HTTPException
from app.schemas import ManualScaleRequest
from app import database as db
from app import scaler, metrics_collector
from app.config import config
from datetime import datetime, timezone

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/events")
async def get_scaling_events(limit: int = 20):
    """
    Returns recent scaling events from MongoDB.
    Shown in the dashboard scaling events table.
    """
    events = db.find_many(
        collection=config.COL_SCALING,
        limit=limit
    )

    for e in events:
        if "timestamp" in e and hasattr(e["timestamp"], "isoformat"):
            e["timestamp"] = e["timestamp"].isoformat()
        if "created_at" in e:
            del e["created_at"]

    return {
        "success": True,
        "count": len(events),
        "data": events
    }


@router.post("/manual")
async def manual_scale(body: ManualScaleRequest):
    """
    Manually scale the workload to a specific replica count.
    Used by the demo control panel on the dashboard.
    """
    replicas = body.replicas
    reason   = body.reason or "manual_override"

    if replicas < config.MIN_REPLICAS or replicas > config.MAX_REPLICAS:
        raise HTTPException(
            status_code=400,
            detail=f"Replicas must be between {config.MIN_REPLICAS} and {config.MAX_REPLICAS}"
        )

    state = metrics_collector.get_current_state()
    current_replicas = state["current_replicas"]

    # Patch K8s
    scaler.patch_k8s_replicas(replicas)
    metrics_collector.set_replicas(replicas)

    # Store event
    action = "scale_up" if replicas > current_replicas else (
        "scale_to_zero" if replicas == 0 else "scale_down"
    )

    event = scaler.store_scaling_event(
        current_replicas=current_replicas,
        desired_replicas=replicas,
        active_users=state["active_users"],
        current_rps=state["current_rps"],
        predicted_rps=0,
        cpu_percent=state["cpu_percent"],
        memory_percent=state["memory_percent"],
        reason=reason,
        action=action
    )

    logger.info(f"Manual scale | {current_replicas} -> {replicas} | reason={reason}")

    return {
        "success": True,
        "message": f"Scaled to {replicas} replicas",
        "previous_replicas": current_replicas,
        "current_replicas": replicas
    }


@router.post("/wakeup")
async def wakeup_workload():
    """
    Called by gateway when first user arrives.
    Ensures workload has at least 1 replica.
    """
    state            = metrics_collector.get_current_state()
    current_replicas = state["current_replicas"]

    if current_replicas == 0:
        scaler.patch_k8s_replicas(1)
        metrics_collector.set_replicas(1)

        scaler.store_scaling_event(
            current_replicas=0,
            desired_replicas=1,
            active_users=state["active_users"],
            current_rps=state["current_rps"],
            predicted_rps=0,
            cpu_percent=state["cpu_percent"],
            memory_percent=state["memory_percent"],
            reason="User arrived, waking up workload",
            action="scale_up"
        )

        logger.info("Workload woken up - scaled from 0 to 1")

        return {
            "success": True,
            "message": "Workload waking up",
            "replicas": 1
        }

    return {
        "success": True,
        "message": "Workload already running",
        "replicas": current_replicas
    }