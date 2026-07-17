# ============================================
# GreenOps Backend - Prophet ML Predictor
# Forecasts future workload using Prophet
# Falls back to moving average if not enough data
# ============================================

import math
import logging
import pandas as pd
from datetime import datetime, timezone, timedelta
from app.config import config
from app import database as db

logger = logging.getLogger(__name__)

# Minimum data points needed for Prophet
MIN_PROPHET_POINTS = 30


# ============================================
# Moving Average Fallback
# ============================================
def moving_average_forecast(rps_values: list, steps: int = 5) -> list:
    """
    Simple moving average fallback when
    not enough data for Prophet.

    Args:
        rps_values: List of recent RPS values
        steps: Number of future steps to predict

    Returns:
        List of predicted RPS values
    """
    if not rps_values:
        return [0.0] * steps

    window = min(5, len(rps_values))
    avg = sum(rps_values[-window:]) / window
    return [round(avg, 2)] * steps


# ============================================
# Get historical RPS from MongoDB
# ============================================
def get_historical_rps(limit: int = 200) -> list:
    """
    Fetches historical RPS data from MongoDB metrics.
    Returns list of (timestamp, rps) tuples.
    """
    records = db.find_many(
        collection=config.COL_METRICS,
        query={},
        sort_field="timestamp",
        sort_order=1,
        limit=limit
    )

    result = []
    for r in records:
        if "timestamp" in r and "current_rps" in r:
            result.append({
                "ds": r["timestamp"],
                "y":  float(r["current_rps"])
            })

    return result


# ============================================
# Prophet Forecast
# ============================================
def prophet_forecast(data: list, forecast_minutes: int = 5) -> dict:
    """
    Runs Prophet forecast on historical RPS data.

    Args:
        data: List of {ds, y} dicts
        forecast_minutes: How far ahead to predict

    Returns:
        Dict with timestamps and predicted_rps
    """
    try:
        from prophet import Prophet
        import warnings
        warnings.filterwarnings("ignore")

        df = pd.DataFrame(data)
        df["ds"] = pd.to_datetime(df["ds"])
        df["y"]  = df["y"].astype(float)

        # Remove negative values
        df = df[df["y"] >= 0]

        if len(df) < MIN_PROPHET_POINTS:
            raise ValueError(
                f"Not enough data: {len(df)} < {MIN_PROPHET_POINTS}"
            )

        # Train Prophet model
        model = Prophet(
            changepoint_prior_scale=0.1,
            seasonality_mode="additive",
            daily_seasonality=False,
            weekly_seasonality=False,
            yearly_seasonality=False
        )
        model.fit(df)

        # Create future dataframe
        # Predict every 30 seconds for next N minutes
        periods = forecast_minutes * 2
        future = model.make_future_dataframe(
            periods=periods,
            freq="30s"
        )

        forecast = model.predict(future)

        # Get only future predictions
        future_forecast = forecast[forecast["ds"] > df["ds"].max()]

        timestamps      = future_forecast["ds"].dt.strftime(
            "%Y-%m-%dT%H:%M:%S"
        ).tolist()

        predicted_rps   = [
            max(0, round(v, 2))
            for v in future_forecast["yhat"].tolist()
        ]

        return {
            "timestamps":   timestamps,
            "predicted_rps": predicted_rps,
            "method":       "prophet"
        }

    except ImportError:
        logger.warning("Prophet not installed - using moving average")
        raise

    except Exception as e:
        logger.warning(f"Prophet forecast failed: {str(e)}")
        raise


# ============================================
# Main: Run Prediction
# ============================================
def run_prediction() -> dict:
    """
    Main prediction function.
    Tries Prophet first, falls back to moving average.
    Stores result in MongoDB.
    Returns prediction result.
    """
    historical = get_historical_rps(limit=200)

    # Current RPS (latest record)
    current_rps = 0.0
    if historical:
        current_rps = historical[-1]["y"]

    try:
        # Try Prophet
        if len(historical) >= MIN_PROPHET_POINTS:
            result = prophet_forecast(historical, forecast_minutes=5)
        else:
            raise ValueError("Not enough data for Prophet")

    except Exception:
        # Fallback to moving average
        rps_values = [d["y"] for d in historical]
        predicted  = moving_average_forecast(rps_values, steps=10)

        now = datetime.now(timezone.utc)
        timestamps = [
            (now + timedelta(seconds=30 * i)).strftime("%Y-%m-%dT%H:%M:%S")
            for i in range(1, 11)
        ]

        result = {
            "timestamps":    timestamps,
            "predicted_rps": predicted,
            "method":        "moving_average" if historical else "fallback"
        }

    # Calculate recommended replicas from max predicted RPS
    max_predicted_rps   = max(result["predicted_rps"]) if result["predicted_rps"] else 0
    recommended_replicas = max(
        1,
        math.ceil(max_predicted_rps / config.TARGET_RPS_PER_POD)
    )
    recommended_replicas = min(recommended_replicas, config.MAX_REPLICAS)

    # Build final result
    prediction_record = {
        "timestamp":            datetime.now(timezone.utc),
        "timestamps":           result["timestamps"],
        "predicted_rps":        result["predicted_rps"],
        "current_rps":          current_rps,
        "recommended_replicas": recommended_replicas,
        "method":               result["method"]
    }

    # Store in MongoDB
    try:
        db.insert_one(config.COL_PREDICTIONS, prediction_record.copy())
    except Exception as e:
        logger.error(f"Failed to store prediction: {str(e)}")

    logger.info(
        f"Prediction | method={result['method']} "
        f"| max_predicted_rps={max_predicted_rps} "
        f"| recommended_replicas={recommended_replicas}"
    )

    return prediction_record