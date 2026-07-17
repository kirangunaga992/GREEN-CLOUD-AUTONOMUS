# ============================================
# GreenOps Backend - Energy Meter
# Calculates energy consumption per interval
# Based on active replicas and CPU utilization
# ============================================

import logging
from datetime import datetime, timezone
from app.config import config
from app import database as db

logger = logging.getLogger(__name__)


# ============================================
# Power Model
# power_watts = P_IDLE + (P_MAX - P_IDLE) * cpu_utilization
# ============================================
def calculate_power_watts(
    cpu_utilization_percent: float,
    num_replicas: int
) -> dict:
    """
    Calculates power consumption in watts.

    Formula:
    per_pod_watts = P_IDLE + (P_MAX - P_IDLE) * (cpu / 100)
    total_watts   = per_pod_watts * num_replicas

    Args:
        cpu_utilization_percent: CPU usage 0-100
        num_replicas: Number of active pods

    Returns dict with per_pod and total watts.
    """
    cpu_fraction    = min(cpu_utilization_percent / 100.0, 1.0)
    p_idle          = config.P_IDLE_WATTS
    p_max           = config.P_MAX_WATTS

    per_pod_watts   = p_idle + (p_max - p_idle) * cpu_fraction
    total_watts     = per_pod_watts * num_replicas

    return {
        "per_pod_watts":    round(per_pod_watts, 4),
        "total_watts":      round(total_watts, 4),
        "cpu_fraction":     round(cpu_fraction, 4)
    }


# ============================================
# Baseline Power (always-on traditional cloud)
# ============================================
def calculate_baseline_power_watts() -> float:
    """
    Calculates baseline power if MAX_REPLICAS
    were always running at idle.

    This represents a traditional always-on cloud.
    """
    return config.P_IDLE_WATTS * config.MAX_REPLICAS


# ============================================
# Energy in kWh
# energy_kwh = power_watts * seconds / 3,600,000
# ============================================
def watts_to_kwh(power_watts: float, interval_seconds: float) -> float:
    """
    Converts power (watts) over an interval (seconds) to kWh.

    Formula:
    kWh = W * seconds / 3,600,000
    """
    return (power_watts * interval_seconds) / 3_600_000


# ============================================
# Carbon Emissions
# carbon_kg = energy_kwh * emission_factor
# ============================================
def energy_to_carbon(energy_kwh: float) -> float:
    """
    Converts energy in kWh to carbon emissions in kg CO2.
    Uses India grid emission factor: 0.708 kgCO2/kWh
    """
    return energy_kwh * config.CARBON_FACTOR


# ============================================
# Electricity Cost
# cost_inr = energy_kwh * cost_per_kwh
# ============================================
def energy_to_cost(energy_kwh: float) -> float:
    """
    Converts energy in kWh to cost in INR.
    Uses ₹8 per kWh.
    """
    return energy_kwh * config.ELECTRICITY_COST


# ============================================
# Main: Calculate full energy record
# ============================================
def calculate_and_store(
    active_replicas:    int,
    cpu_percent:        float,
    interval_seconds:   float
) -> dict:
    """
    Calculates energy, carbon, and cost for one interval.
    Stores record in MongoDB.
    Returns the full record.

    Args:
        active_replicas:  Current pod count
        cpu_percent:      Current CPU utilization
        interval_seconds: Time since last calculation

    Returns:
        Full energy record dict
    """
    # ----------------------------------------
    # Actual consumption
    # ----------------------------------------
    actual_power  = calculate_power_watts(cpu_percent, active_replicas)
    actual_watts  = actual_power["total_watts"]
    actual_kwh    = watts_to_kwh(actual_watts, interval_seconds)

    # ----------------------------------------
    # Baseline (traditional cloud)
    # ----------------------------------------
    baseline_watts  = calculate_baseline_power_watts()
    baseline_kwh    = watts_to_kwh(baseline_watts, interval_seconds)

    # ----------------------------------------
    # Savings
    # ----------------------------------------
    saved_kwh   = max(0, baseline_kwh - actual_kwh)

    # ----------------------------------------
    # Carbon
    # ----------------------------------------
    carbon_kg       = energy_to_carbon(actual_kwh)
    carbon_saved_kg = energy_to_carbon(saved_kwh)

    # ----------------------------------------
    # Cost
    # ----------------------------------------
    cost_inr        = energy_to_cost(actual_kwh)
    cost_saved_inr  = energy_to_cost(saved_kwh)

    # ----------------------------------------
    # Build record
    # ----------------------------------------
    record = {
        "timestamp":            datetime.now(timezone.utc),
        "active_replicas":      active_replicas,
        "cpu_utilization":      round(cpu_percent, 2),
        "actual_power_watts":   round(actual_watts, 4),
        "baseline_power_watts": round(baseline_watts, 4),
        "actual_energy_kwh":    round(actual_kwh, 8),
        "baseline_energy_kwh":  round(baseline_kwh, 8),
        "saved_energy_kwh":     round(saved_kwh, 8),
        "carbon_kg":            round(carbon_kg, 8),
        "carbon_saved_kg":      round(carbon_saved_kg, 8),
        "cost_inr":             round(cost_inr, 6),
        "cost_saved_inr":       round(cost_saved_inr, 6),
        "interval_seconds":     interval_seconds
    }

    # Store in MongoDB
    try:
        db.insert_one(config.COL_ENERGY, record.copy())
    except Exception as e:
        logger.error(f"Failed to store energy record: {str(e)}")

    logger.info(
        f"Energy | actual={actual_kwh:.6f}kWh "
        f"| saved={saved_kwh:.6f}kWh "
        f"| carbon_saved={carbon_saved_kg:.6f}kg "
        f"| cost_saved=₹{cost_saved_inr:.4f}"
    )

    return record


# ============================================
# Get today's sustainability totals
# ============================================
def get_today_totals() -> dict:
    """
    Returns aggregated energy/carbon/cost
    totals for today from MongoDB.
    """
    return {
        "energy_kwh_today":         db.get_today_sum(config.COL_ENERGY, "actual_energy_kwh"),
        "baseline_kwh_today":       db.get_today_sum(config.COL_ENERGY, "baseline_energy_kwh"),
        "saved_energy_kwh_today":   db.get_today_sum(config.COL_ENERGY, "saved_energy_kwh"),
        "carbon_kg_today":          db.get_today_sum(config.COL_ENERGY, "carbon_kg"),
        "carbon_saved_kg_today":    db.get_today_sum(config.COL_ENERGY, "carbon_saved_kg"),
        "cost_inr_today":           db.get_today_sum(config.COL_ENERGY, "cost_inr"),
        "cost_saved_inr_today":     db.get_today_sum(config.COL_ENERGY, "cost_saved_inr")
    }