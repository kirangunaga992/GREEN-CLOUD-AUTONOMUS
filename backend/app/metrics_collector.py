# ============================================
# GreenOps Backend - Metrics Collector
# Collects CPU, memory, RPS, pod count
# from psutil and Kubernetes
# ============================================

import time
import logging
import requests
import psutil
from datetime import datetime, timezone
from app.config import config
from app import database as db

logger = logging.getLogger(__name__)

# ============================================
# In-memory state
# Shared across the application
# ============================================
_state = {
    "active_users":       0,
    "current_rps":        0.0,
    "cpu_percent":        0.0,
    "memory_percent":     0.0,
    "current_replicas":   0,
    "last_request_count": 0,
    "last_rps_time":      time.time(),
    "request_counts":     [],   # rolling window for RPS calc
    "idle_since":         None  # when traffic went to 0
}


# ============================================
# Update active users from gateway report
# ============================================
def update_active_users(active_users: int, total_requests: int):
    """
    Called when gateway reports session stats.
    Updates in-memory state.
    """
    _state["active_users"] = active_users

    # Calculate RPS from request count delta
    now = time.time()
    elapsed = now - _state["last_rps_time"]

    if elapsed > 0:
        delta_requests = total_requests - _state["last_request_count"]
        if delta_requests >= 0:
            rps = delta_requests / elapsed
            _state["current_rps"] = round(rps, 2)

    _state["last_request_count"] = total_requests
    _state["last_rps_time"] = now

    # Track idle time
    if active_users == 0 and _state["current_rps"] == 0:
        if _state["idle_since"] is None:
            _state["idle_since"] = now
            logger.info("System went idle - starting idle timer")
    else:
        if _state["idle_since"] is not None:
            logger.info("System active again - resetting idle timer")
        _state["idle_since"] = None


# ============================================
# Collect system metrics (CPU, memory)
# ============================================
def collect_system_metrics() -> dict:
    """
    Collects CPU and memory usage using psutil.
    In Kubernetes, this reflects the node's usage.
    """
    try:
        cpu     = psutil.cpu_percent(interval=1)
        memory  = psutil.virtual_memory().percent

        _state["cpu_percent"]    = cpu
        _state["memory_percent"] = memory

        return {
            "cpu_percent":    cpu,
            "memory_percent": memory
        }

    except Exception as e:
        logger.error(f"System metrics collection failed: {str(e)}")
        return {
            "cpu_percent":    0.0,
            "memory_percent": 0.0
        }


# ============================================
# Get current replica count from Kubernetes
# ============================================
def get_current_replicas() -> int:
    """
    Gets the current replica count of the
    green-workload deployment from Kubernetes.
    Falls back to in-memory state if K8s unavailable.
    """
    try:
        from kubernetes import client, config as k8s_config

        try:
            # Try in-cluster config first (when running in K8s)
            k8s_config.load_incluster_config()
        except Exception:
            # Fall back to local kubeconfig
            k8s_config.load_kube_config()

        apps_v1 = client.AppsV1Api()
        deployment = apps_v1.read_namespaced_deployment(
            name=config.WORKLOAD_DEPLOYMENT,
            namespace=config.K8S_NAMESPACE
        )

        replicas = deployment.status.ready_replicas or 0
        _state["current_replicas"] = replicas
        return replicas

    except Exception as e:
        logger.debug(f"K8s replica check failed (using cached): {str(e)}")
        return _state["current_replicas"]


# ============================================
# Collect and store full metrics snapshot
# ============================================
def collect_and_store() -> dict:
    """
    Collects all metrics, stores in MongoDB,
    and returns the snapshot.
    Called every 10 seconds by scheduler.
    """
    system  = collect_system_metrics()
    replicas = get_current_replicas()

    snapshot = {
        "timestamp":          datetime.now(timezone.utc),
        "cpu_percent":        system["cpu_percent"],
        "memory_percent":     system["memory_percent"],
        "active_users":       _state["active_users"],
        "current_rps":        _state["current_rps"],
        "current_replicas":   replicas
    }

    # Store in MongoDB
    try:
        db.insert_one(config.COL_METRICS, snapshot.copy())
    except Exception as e:
        logger.error(f"Failed to store metrics: {str(e)}")

    logger.info(
        f"Metrics | cpu={snapshot['cpu_percent']}% "
        f"| mem={snapshot['memory_percent']}% "
        f"| users={snapshot['active_users']} "
        f"| rps={snapshot['current_rps']} "
        f"| replicas={snapshot['current_replicas']}"
    )

    return snapshot


# ============================================
# Get current state snapshot
# ============================================
def get_current_state() -> dict:
    """
    Returns current in-memory state.
    Used by autoscaler and dashboard.
    """
    return {
        "active_users":     _state["active_users"],
        "current_rps":      _state["current_rps"],
        "cpu_percent":      _state["cpu_percent"],
        "memory_percent":   _state["memory_percent"],
        "current_replicas": _state["current_replicas"],
        "idle_since":       _state["idle_since"]
    }


# ============================================
# Get idle duration in seconds
# ============================================
def get_idle_duration() -> float:
    """
    Returns how many seconds the system has been idle.
    Returns 0 if system is not idle.
    """
    if _state["idle_since"] is None:
        return 0.0
    return time.time() - _state["idle_since"]


# ============================================
# Manually update replicas in state
# ============================================
def set_replicas(replicas: int):
    """
    Updates the in-memory replica count.
    Called after scaling action.
    """
    _state["current_replicas"] = replicas