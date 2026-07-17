# ============================================
# GreenOps Backend - Pydantic Schemas
# Request/Response models for API validation
# ============================================

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============================================
# Metrics
# ============================================
class MetricRecord(BaseModel):
    timestamp:       datetime
    cpu_percent:     float
    memory_percent:  float
    active_users:    int
    current_rps:     float
    current_replicas: int


# ============================================
# Energy
# ============================================
class EnergyRecord(BaseModel):
    timestamp:              datetime
    active_replicas:        int
    cpu_utilization:        float
    actual_power_watts:     float
    baseline_power_watts:   float
    actual_energy_kwh:      float
    baseline_energy_kwh:    float
    saved_energy_kwh:       float
    carbon_kg:              float
    carbon_saved_kg:        float
    cost_inr:               float
    cost_saved_inr:         float
    interval_seconds:       float


# ============================================
# Scaling Event
# ============================================
class ScalingEvent(BaseModel):
    timestamp:          datetime
    current_replicas:   int
    desired_replicas:   int
    active_users:       int
    current_rps:        float
    predicted_rps:      float
    cpu_percent:        float
    memory_percent:     float
    reason:             str
    action:             str  # scale_up / scale_down / scale_to_zero / no_change


# ============================================
# Prediction
# ============================================
class PredictionResult(BaseModel):
    timestamp:              datetime
    timestamps:             List[str]
    predicted_rps:          List[float]
    current_rps:            float
    recommended_replicas:   int
    method:                 str  # prophet / moving_average / fallback


# ============================================
# Session Report (from Gateway)
# ============================================
class SessionReport(BaseModel):
    active_users:               int
    total_requests_in_session:  int
    sessions:                   List[dict]


# ============================================
# Manual Scale Request
# ============================================
class ManualScaleRequest(BaseModel):
    replicas: int = Field(..., ge=0, le=5)
    reason:   Optional[str] = "manual"


# ============================================
# Dashboard Summary Response
# ============================================
class DashboardSummary(BaseModel):
    active_users:           int
    current_rps:            float
    cpu_percent:            float
    memory_percent:         float
    current_replicas:       int
    workload_status:        str
    energy_kwh_today:       float
    carbon_kg_today:        float
    carbon_saved_kg_today:  float
    cost_saved_inr_today:   float
    last_scaling_action:    Optional[dict]