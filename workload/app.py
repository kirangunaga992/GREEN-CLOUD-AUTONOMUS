# ============================================
# GreenOps Autonomous - Scalable Workload App
# This app simulates a real workload that
# consumes CPU and serves requests.
# Kubernetes will scale this from 0 to 5 pods.
# ============================================

import os
import time
import math
import socket
import logging
from flask import Flask, jsonify, request
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

# ============================================
# App Setup
# ============================================
app = Flask(__name__)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ============================================
# Prometheus Metrics
# ============================================
REQUEST_COUNT = Counter(
    "workload_requests_total",
    "Total number of requests received",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "workload_request_latency_seconds",
    "Request latency in seconds",
    ["endpoint"]
)

ACTIVE_REQUESTS = Gauge(
    "workload_active_requests",
    "Number of requests currently being processed"
)

CPU_WORK_GAUGE = Gauge(
    "workload_cpu_work_units",
    "Amount of CPU work done in last request"
)

# ============================================
# Helper: CPU Burner
# Simulates real CPU work so scaling triggers
# ============================================
def burn_cpu(duration_seconds: float, intensity: int = 1000):
    """
    Burns CPU for a given duration.
    This makes the pod actually use CPU
    so Kubernetes HPA and our scaler can detect load.
    """
    start = time.time()
    result = 0
    while time.time() - start < duration_seconds:
        # Math operations to consume CPU
        for i in range(intensity):
            result += math.sqrt(i) * math.sin(i) * math.cos(i)
    return result

# ============================================
# Routes
# ============================================

@app.route("/health", methods=["GET"])
def health():
    """
    Health check endpoint.
    Kubernetes readiness and liveness probe uses this.
    """
    return jsonify({
        "status": "healthy",
        "pod_name": socket.gethostname(),
        "timestamp": time.time()
    }), 200


@app.route("/", methods=["GET"])
def home():
    """
    Root endpoint.
    Simple welcome response.
    """
    REQUEST_COUNT.labels(
        method="GET",
        endpoint="/",
        status="200"
    ).inc()

    return jsonify({
        "app": "GreenOps Workload",
        "pod": socket.gethostname(),
        "message": "Workload app is running",
        "timestamp": time.time()
    }), 200


@app.route("/work", methods=["GET"])
def do_work():
    """
    Main work endpoint.
    Simulates real processing work.
    Friends hit this endpoint to generate traffic.
    CPU usage increases with more requests.
    """
    ACTIVE_REQUESTS.inc()
    start_time = time.time()

    try:
        # Get intensity from query param (default = light work)
        intensity = request.args.get("intensity", "light")

        if intensity == "heavy":
            # Burns CPU for 0.5 seconds
            burn_cpu(duration_seconds=0.5, intensity=2000)
            work_units = 2000

        elif intensity == "medium":
            # Burns CPU for 0.2 seconds
            burn_cpu(duration_seconds=0.2, intensity=1000)
            work_units = 1000

        else:
            # Light work - minimal CPU
            burn_cpu(duration_seconds=0.05, intensity=200)
            work_units = 200

        CPU_WORK_GAUGE.set(work_units)

        latency = time.time() - start_time

        REQUEST_COUNT.labels(
            method="GET",
            endpoint="/work",
            status="200"
        ).inc()

        REQUEST_LATENCY.labels(endpoint="/work").observe(latency)

        logger.info(f"Work done | pod={socket.gethostname()} | intensity={intensity} | latency={latency:.3f}s")

        return jsonify({
            "status": "done",
            "pod": socket.gethostname(),
            "intensity": intensity,
            "work_units": work_units,
            "latency_seconds": round(latency, 4),
            "timestamp": time.time()
        }), 200

    except Exception as e:
        REQUEST_COUNT.labels(
            method="GET",
            endpoint="/work",
            status="500"
        ).inc()
        logger.error(f"Work failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

    finally:
        ACTIVE_REQUESTS.dec()


@app.route("/cpu", methods=["GET"])
def cpu_stress():
    """
    CPU stress endpoint.
    Deliberately burns CPU for 1 second.
    Used for demonstrating CPU-based scaling.
    """
    ACTIVE_REQUESTS.inc()
    start_time = time.time()

    try:
        # Hard CPU burn for 1 second
        burn_cpu(duration_seconds=1.0, intensity=5000)

        latency = time.time() - start_time

        REQUEST_COUNT.labels(
            method="GET",
            endpoint="/cpu",
            status="200"
        ).inc()

        REQUEST_LATENCY.labels(endpoint="/cpu").observe(latency)

        logger.info(f"CPU stress done | pod={socket.gethostname()} | latency={latency:.3f}s")

        return jsonify({
            "status": "cpu_stressed",
            "pod": socket.gethostname(),
            "latency_seconds": round(latency, 4),
            "timestamp": time.time()
        }), 200

    except Exception as e:
        logger.error(f"CPU stress failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

    finally:
        ACTIVE_REQUESTS.dec()


@app.route("/info", methods=["GET"])
def info():
    """
    Returns pod information.
    Useful to show which pod is serving the request.
    Great for demo - shows load balancing across pods.
    """
    return jsonify({
        "pod_name": socket.gethostname(),
        "pod_ip": socket.gethostbyname(socket.gethostname()),
        "app_version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "local"),
        "timestamp": time.time()
    }), 200


@app.route("/metrics", methods=["GET"])
def metrics():
    """
    Prometheus metrics endpoint.
    Prometheus scrapes this to collect workload metrics.
    """
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}


# ============================================
# Error Handlers
# ============================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "internal server error"}), 500


# ============================================
# Main Entry Point
# ============================================
if __name__ == "__main__":
    port = int(os.getenv("WORKLOAD_PORT", 5000))
    logger.info(f"Starting GreenOps Workload App on port {port}")
    logger.info(f"Pod name: {socket.gethostname()}")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )