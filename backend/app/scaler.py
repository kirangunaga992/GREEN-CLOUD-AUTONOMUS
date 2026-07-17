# ============================================
# GreenOps Backend - Autoscaler
# Makes scaling decisions and patches
# Kubernetes deployment replicas
# ============================================

import math
import time
import logging
from datetime import datetime, timezone
from app.config import config
from app import database as db
from app import metrics_collector

logger = logging.getLogger(__name__)

# ============================================
# Cooldown tracking
# ============================================
_last_scale_up_time   = 0.0
_last_scale_down_time = 0.0
_last_decision_replicas = 0


# ============================================
# Kubernetes: Patch Deployment Replicas
# ============================================
def patch_k8s_replicas(replicas: int) -> bool:
    """
    Updates the green-workload deployment
    replica count in Kubernetes.

    Returns True if successful, False if failed.
    Falls back gracefully if K8s not available.
    """
    try:
        from kubernetes import client, config as k8s_config

        try:
            k8s_config.load_incluster_config()
        except Exception:
            k8s_config.load_kube_config()

        apps_v1 = client.AppsV1Api()

        # Patch body
        patch_body = {
            "spec": {
                "replicas": replicas
            }
        }

        apps_v1.patch_namespaced_deployment(
            name=config.WORKLOAD_DEPLOYMENT,
            namespace=config.K8S_NAMESPACE,
            body=patch_body
        )

        logger.info(
            f"K8s patched | deployment={config.WORKLOAD_DEPLOYMENT} "
            f"| replicas={replicas}"
        )
        return True

    except Exception as e:
        logger.warning(f"K8s patch failed (simulation mode): {str(e)}")
        # In local dev without K8s, just update state
        metrics_collector.set_replicas(replicas)
        return False


# ============================================
# Store Scaling Event in MongoDB
# ============================================
def store_scaling_event(
    current_replicas:   int,
    desired_replicas:   int,
    active_users:       int,
    current_rps:        float,
    predicted_rps:      float,
    cpu_percent:        float,
    memory_percent:     float,
    reason:             str,
    action:             str
):
    """
    Stores every scaling decision in MongoDB.
    Even no-change decisions are stored for audit.
    """
    event = {
        "timestamp":        datetime.now(timezone.utc),
        "current_replicas": current_replicas,
        "desired_replicas": desired_replicas,
        "active_users":     active_users,
        "current_rps":      current_rps,
        "predicted_rps":    predicted_rps,
        "cpu_percent":      cpu_percent,
        "memory_percent":   memory_percent,
        "reason":           reason,
        "action":           action
    }

    try:
        db.insert_one(config.COL_SCALING, event.copy())
    except Exception as e:
        logger.error(f"Failed to store scaling event: {str(e)}")

    return event


# ============================================
# Main Autoscaler Decision Logic
# ============================================
def make_scaling_decision(
    active_users:   int,
    current_rps:    float,
    predicted_rps:  float,
    cpu_percent:    float,
    memory_percent: float,
    idle_duration:  float
) -> dict:
    """
    Core autoscaler logic.
    Decides how many replicas the workload should have.

    Decision priority:
    1. Scale to zero if idle too long
    2. Scale up if CPU high
    3. Scale based on RPS (actual vs predicted)
    4. Scale down if CPU low and users low
    5. Keep current if in cooldown

    Returns scaling decision dict.
    """
    global _last_scale_up_time, _last_scale_down_time
    global _last_decision_replicas

    now              = time.time()
    current_replicas = metrics_collector.get_current_state()["current_replicas"]

    # ----------------------------------------
    # RULE 1: Scale to Zero
    # If no users and no traffic for 60+ seconds
    # ----------------------------------------
    if (
        active_users == 0
        and current_rps == 0
        and idle_duration >= config.IDLE_SCALE_TO_ZERO_SECONDS
        and current_replicas > 0
    ):
        desired = 0
        reason  = (
            f"No users and no traffic for "
            f"{idle_duration:.0f}s >= "
            f"{config.IDLE_SCALE_TO_ZERO_SECONDS}s"
        )
        action = "scale_to_zero"
        return _execute_scaling(
            current_replicas, desired,
            active_users, current_rps, predicted_rps,
            cpu_percent, memory_percent,
            reason, action, now
        )

    # ----------------------------------------
    # RULE 2: If no users and already at 0, stay at 0
    # ----------------------------------------
    if active_users == 0 and current_replicas == 0:
        return _no_change(
            current_replicas, active_users,
            current_rps, predicted_rps,
            cpu_percent, memory_percent,
            "No users, staying at 0"
        )

    # ----------------------------------------
    # RULE 3: If users present but replicas = 0
    # Scale to at least 1 immediately
    # ----------------------------------------
    if active_users > 0 and current_replicas == 0:
        desired = 1
        reason  = f"Users arrived ({active_users} users), waking up workload"
        action  = "scale_up"
        return _execute_scaling(
            current_replicas, desired,
            active_users, current_rps, predicted_rps,
            cpu_percent, memory_percent,
            reason, action, now,
            skip_cooldown=True
        )

    # ----------------------------------------
    # RULE 4: CPU-based scale up
    # ----------------------------------------
    if cpu_percent > config.CPU_SCALE_UP_THRESHOLD:

        # Check cooldown
        if now - _last_scale_up_time < config.SCALE_UP_COOLDOWN:
            return _no_change(
                current_replicas, active_users,
                current_rps, predicted_rps,
                cpu_percent, memory_percent,
                f"CPU high ({cpu_percent}%) but in scale-up cooldown"
            )

        desired = min(current_replicas + 1, config.MAX_REPLICAS)
        reason  = f"CPU {cpu_percent}% > threshold {config.CPU_SCALE_UP_THRESHOLD}%"
        action  = "scale_up"
        return _execute_scaling(
            current_replicas, desired,
            active_users, current_rps, predicted_rps,
            cpu_percent, memory_percent,
            reason, action, now
        )

    # ----------------------------------------
    # RULE 5: RPS-based scaling (actual + predicted)
    # ----------------------------------------
    effective_rps       = max(current_rps, predicted_rps)
    load_based_replicas = math.ceil(
        effective_rps / config.TARGET_RPS_PER_POD
    ) if effective_rps > 0 else 1

    # Clamp
    load_based_replicas = max(1, min(load_based_replicas, config.MAX_REPLICAS))

    if load_based_replicas > current_replicas:

        if now - _last_scale_up_time < config.SCALE_UP_COOLDOWN:
            return _no_change(
                current_replicas, active_users,
                current_rps, predicted_rps,
                cpu_percent, memory_percent,
                "RPS-based scale-up in cooldown"
            )

        reason = (
            f"RPS-based: effective_rps={effective_rps} "
            f"needs {load_based_replicas} replicas"
        )
        action = "scale_up"
        return _execute_scaling(
            current_replicas, load_based_replicas,
            active_users, current_rps, predicted_rps,
            cpu_percent, memory_percent,
            reason, action, now
        )

    # ----------------------------------------
    # RULE 6: CPU-based scale down
    # ----------------------------------------
    if (
        cpu_percent < config.CPU_SCALE_DOWN_THRESHOLD
        and active_users <= 1
        and current_replicas > 1
    ):

        if now - _last_scale_down_time < config.SCALE_DOWN_COOLDOWN:
            return _no_change(
                current_replicas, active_users,
                current_rps, predicted_rps,
                cpu_percent, memory_percent,
                "CPU low but in scale-down cooldown"
            )

        desired = max(1, current_replicas - 1)
        reason  = (
            f"CPU {cpu_percent}% < threshold "
            f"{config.CPU_SCALE_DOWN_THRESHOLD}% and users={active_users}"
        )
        action  = "scale_down"
        return _execute_scaling(
            current_replicas, desired,
            active_users, current_rps, predicted_rps,
            cpu_percent, memory_percent,
            reason, action, now
        )

    # ----------------------------------------
    # Default: No change needed
    # ----------------------------------------
    return _no_change(
        current_replicas, active_users,
        current_rps, predicted_rps,
        cpu_percent, memory_percent,
        "System stable, no scaling needed"
    )


# ============================================
# Execute Scaling Action
# ============================================
def _execute_scaling(
    current_replicas:   int,
    desired_replicas:   int,
    active_users:       int,
    current_rps:        float,
    predicted_rps:      float,
    cpu_percent:        float,
    memory_percent:     float,
    reason:             str,
    action:             str,
    now:                float,
    skip_cooldown:      bool = False
) -> dict:
    """
    Executes the scaling decision.
    Updates cooldown timers.
    Patches K8s deployment.
    Stores event in MongoDB.
    """
    global _last_scale_up_time, _last_scale_down_time

    # Update cooldown
    if not skip_cooldown:
        if action == "scale_up":
            _last_scale_up_time = now
        elif action in ("scale_down", "scale_to_zero"):
            _last_scale_down_time = now

    # Patch Kubernetes
    if desired_replicas != current_replicas:
        patch_k8s_replicas(desired_replicas)
        metrics_collector.set_replicas(desired_replicas)

        logger.info(
            f"SCALING | {action.upper()} "
            f"| {current_replicas} -> {desired_replicas} replicas "
            f"| reason: {reason}"
        )

    # Store event
    event = store_scaling_event(
        current_replicas=current_replicas,
        desired_replicas=desired_replicas,
        active_users=active_users,
        current_rps=current_rps,
        predicted_rps=predicted_rps,
        cpu_percent=cpu_percent,
        memory_percent=memory_percent,
        reason=reason,
        action=action
    )

    return event


# ============================================
# No Change Helper
# ============================================
def _no_change(
    current_replicas:   int,
    active_users:       int,
    current_rps:        float,
    predicted_rps:      float,
    cpu_percent:        float,
    memory_percent:     float,
    reason:             str
) -> dict:
    """
    Returns a no-change decision without storing in MongoDB.
    """
    return {
        "action":           "no_change",
        "current_replicas": current_replicas,
        "desired_replicas": current_replicas,
        "reason":           reason
    }