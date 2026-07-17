# ============================================
# GreenOps Backend - Configuration
# All settings loaded from environment vars
# ============================================

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ----------------------------------------
    # App
    # ----------------------------------------
    APP_NAME        = "GreenOps Autonomous API"
    APP_VERSION     = "1.0.0"
    HOST            = os.getenv("BACKEND_HOST", "0.0.0.0")
    PORT            = int(os.getenv("BACKEND_PORT", 8000))
    DEBUG           = os.getenv("DEBUG", "false").lower() == "true"

    # ----------------------------------------
    # MongoDB
    # ----------------------------------------
    MONGO_URI       = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME   = os.getenv("MONGO_DB_NAME", "greenops")

    # Collections
    COL_METRICS     = "metrics"
    COL_ENERGY      = "energy"
    COL_SCALING     = "scaling_events"
    COL_PREDICTIONS = "predictions"
    COL_SESSIONS    = "sessions"

    # ----------------------------------------
    # Kubernetes
    # ----------------------------------------
    K8S_NAMESPACE           = os.getenv("K8S_NAMESPACE", "greenops")
    WORKLOAD_DEPLOYMENT     = os.getenv("WORKLOAD_DEPLOYMENT_NAME", "green-workload")
    MIN_REPLICAS            = int(os.getenv("MIN_REPLICAS", 0))
    MAX_REPLICAS            = int(os.getenv("MAX_REPLICAS", 5))

    # ----------------------------------------
    # Autoscaler Thresholds
    # ----------------------------------------
    CPU_SCALE_UP_THRESHOLD      = float(os.getenv("SCALE_UP_CPU_THRESHOLD", 65))
    CPU_SCALE_DOWN_THRESHOLD    = float(os.getenv("SCALE_DOWN_CPU_THRESHOLD", 25))
    TARGET_RPS_PER_POD          = float(os.getenv("TARGET_RPS_PER_POD", 20))
    IDLE_SCALE_TO_ZERO_SECONDS  = int(os.getenv("IDLE_SCALE_TO_ZERO_SECONDS", 60))
    SCALE_UP_COOLDOWN           = int(os.getenv("SCALE_UP_COOLDOWN_SECONDS", 10))
    SCALE_DOWN_COOLDOWN         = int(os.getenv("SCALE_DOWN_COOLDOWN_SECONDS", 60))
    AUTOSCALER_INTERVAL         = int(os.getenv("AUTOSCALER_INTERVAL", 10))

    # ----------------------------------------
    # Energy / Carbon / Cost Constants
    # ----------------------------------------
    P_IDLE_WATTS            = float(os.getenv("P_IDLE_WATTS", 35))
    P_MAX_WATTS             = float(os.getenv("P_MAX_WATTS", 90))
    CARBON_FACTOR           = float(os.getenv("CARBON_FACTOR_KG_PER_KWH", 0.708))
    ELECTRICITY_COST        = float(os.getenv("ELECTRICITY_COST_PER_KWH", 8))

    # ----------------------------------------
    # External Services
    # ----------------------------------------
    PROMETHEUS_URL  = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
    GATEWAY_URL     = os.getenv("GATEWAY_URL",    "http://localhost:5001")
    WORKLOAD_URL    = os.getenv("WORKLOAD_URL",   "http://localhost:5000")


# Single config instance
config = Config()