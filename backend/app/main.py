# ============================================
# GreenOps Backend - Main FastAPI Application
# ============================================

import time
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import Gauge, generate_latest, CONTENT_TYPE_LATEST, REGISTRY
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import config
from app import database as db
from app import metrics_collector as mc
from app.energy_meter import calculate_and_store, get_today_totals
from app.predictor import run_prediction
from app.scaler import make_scaling_decision

from app.routes import (
    dashboard,
    metrics,
    scaling,
    prediction,
    session,
    sustainability,
    users,
)

# ============================================
# Logging
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ============================================
# Safe Prometheus Gauges
# ============================================
def safe_gauge(name: str, description: str):
    existing = REGISTRY._names_to_collectors.get(name)
    if existing:
        return existing
    return Gauge(name, description)

CURRENT_REPLICAS_GAUGE = safe_gauge(
    "greenops_current_replicas",
    "Current workload replica count"
)

ACTIVE_USERS_GAUGE = safe_gauge(
    "greenops_active_users",
    "Current active users"
)

ENERGY_KWH_GAUGE = safe_gauge(
    "greenops_energy_kwh_today",
    "Energy consumed today in kWh"
)

CARBON_SAVED_GAUGE = safe_gauge(
    "greenops_carbon_saved_kg_today",
    "Carbon saved today in kg"
)

_last_energy_time = time.time()

# ============================================
# Background Jobs
# ============================================
async def run_metrics_collection():
    try:
        snapshot = mc.collect_and_store()
        CURRENT_REPLICAS_GAUGE.set(snapshot.get("current_replicas", 0))
        ACTIVE_USERS_GAUGE.set(snapshot.get("active_users", 0))
    except Exception as e:
        logger.error(f"Metrics collection error: {e}")


async def run_energy_job():
    global _last_energy_time
    try:
        now = time.time()
        interval = now - _last_energy_time
        _last_energy_time = now

        state = mc.get_current_state()

        calculate_and_store(
            active_replicas=state.get("current_replicas", 0),
            cpu_percent=state.get("cpu_percent", 0.0),
            interval_seconds=interval
        )

        totals = get_today_totals()
        ENERGY_KWH_GAUGE.set(totals.get("energy_kwh_today", 0.0))
        CARBON_SAVED_GAUGE.set(totals.get("carbon_saved_kg_today", 0.0))

    except Exception as e:
        logger.error(f"Energy job error: {e}")


async def run_prediction_job():
    try:
        run_prediction()
    except Exception as e:
        logger.error(f"Prediction job error: {e}")


async def run_autoscaler_job():
    try:
        state = mc.get_current_state()
        idle_duration = mc.get_idle_duration()

        latest_pred = db.get_latest(config.COL_PREDICTIONS)
        predicted_rps = 0.0

        if latest_pred and "predicted_rps" in latest_pred:
            preds = latest_pred["predicted_rps"]
            if preds:
                predicted_rps = preds[0]

        decision = make_scaling_decision(
            active_users=state.get("active_users", 0),
            current_rps=state.get("current_rps", 0.0),
            predicted_rps=predicted_rps,
            cpu_percent=state.get("cpu_percent", 0.0),
            memory_percent=state.get("memory_percent", 0.0),
            idle_duration=idle_duration
        )

        if decision.get("action") != "no_change":
            logger.info(
                f"Autoscaler | {decision.get('action')} | "
                f"{decision.get('current_replicas')} -> "
                f"{decision.get('desired_replicas')}"
            )

    except Exception as e:
        logger.error(f"Autoscaler job error: {e}")

# ============================================
# Lifespan
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 55)
    logger.info(f"  {config.APP_NAME} v{config.APP_VERSION}")
    logger.info("=" * 55)

    try:
        db.get_db()
        logger.info("MongoDB connection established")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")

    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_metrics_collection, "interval", seconds=10, id="metrics")
    scheduler.add_job(run_energy_job, "interval", seconds=10, id="energy")
    scheduler.add_job(run_autoscaler_job, "interval", seconds=10, id="autoscaler")
    scheduler.add_job(run_prediction_job, "interval", seconds=60, id="prediction")
    scheduler.start()

    logger.info("Scheduler started")
    logger.info(f"Docs: http://localhost:{config.PORT}/docs")

    yield

    scheduler.shutdown()
    logger.info("Backend shutdown complete")

# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description="AI-Driven Sustainable Cloud Infrastructure",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ============================================
# Routers
# ============================================
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])
app.include_router(scaling.router, prefix="/api/scaling", tags=["Scaling"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["Prediction"])
app.include_router(session.router, prefix="/api/session", tags=["Session"])
app.include_router(sustainability.router, prefix="/api/sustainability", tags=["Sustainability"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

# ============================================
# Basic Endpoints
# ============================================
@app.get("/")
async def root():
    return {
        "app": config.APP_NAME,
        "version": config.APP_VERSION,
        "status": "running",
        "docs": f"http://localhost:{config.PORT}/docs"
    }

@app.get("/health")
async def health():
    mongo_ok = db.ping_db()
    return {
        "status": "healthy" if mongo_ok else "degraded",
        "mongodb": "connected" if mongo_ok else "disconnected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/metrics")
async def metrics_endpoint():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

# ============================================
# Entry Point
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info"
    )
