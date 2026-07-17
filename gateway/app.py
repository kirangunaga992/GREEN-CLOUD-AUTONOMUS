# ============================================
# GreenOps Traffic Gateway + User Portal Server
# ============================================

import os
import time
import logging
import threading
import requests
from flask import Flask, jsonify, request, Response, send_from_directory
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
import session_manager

app = Flask(__name__)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Config
WORKLOAD_URL = os.getenv("WORKLOAD_URL", "http://localhost:5000")
BACKEND_URL  = os.getenv("BACKEND_URL",  "http://localhost:8000")
GATEWAY_PORT = int(os.getenv("GATEWAY_PORT", 5001))

REPORT_INTERVAL = 5
CLEANUP_INTERVAL = 10

# Prometheus metrics
ACTIVE_USERS_GAUGE = Gauge("gateway_active_users", "Currently active users")
GATEWAY_REQUESTS   = Counter("gateway_requests_total", "Total requests", ["endpoint", "status"])
FORWARDED_REQ      = Counter("gateway_forwarded_requests_total", "Forwarded to workload", ["status"])
FORWARD_LATENCY    = Histogram("gateway_forward_latency_seconds", "Forward latency")
WORKLOAD_AVAIL     = Gauge("gateway_workload_available", "Workload availability")

# ============================================
# Background: Session cleanup + report
# ============================================
def report_sessions_to_backend():
    try:
        stats = session_manager.get_session_stats()
        ACTIVE_USERS_GAUGE.set(stats["active_users"])
        requests.post(f"{BACKEND_URL}/api/session/report", json=stats, timeout=3)
    except Exception as e:
        logger.debug(f"Backend report skipped: {e}")

def request_scale_up():
    try:
        requests.post(f"{BACKEND_URL}/api/scaling/wakeup", json={"reason": "user_arrived"}, timeout=3)
        logger.info("Sent wakeup signal to backend")
    except Exception as e:
        logger.debug(f"Wakeup failed: {e}")

def background_worker():
    counter = 0
    while True:
        try:
            time.sleep(CLEANUP_INTERVAL)
            expired = session_manager.cleanup_expired_sessions()
            if expired:
                logger.info(f"Cleaned {expired} expired sessions")
            counter += CLEANUP_INTERVAL
            if counter >= REPORT_INTERVAL:
                report_sessions_to_backend()
                counter = 0
        except Exception as e:
            logger.error(f"Worker error: {e}")

threading.Thread(target=background_worker, daemon=True, name="cleanup-worker").start()

# ============================================
# STATIC PORTAL PAGE
# ============================================
@app.route("/")
def serve_portal():
    portal_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    if os.path.exists(os.path.join(portal_dir, "index.html")):
        return send_from_directory(portal_dir, "index.html")
    return jsonify({"service": "gateway", "message": "Portal not found"}), 200


@app.route("/dashboard")
def serve_dashboard():
    portal_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    if os.path.exists(os.path.join(portal_dir, "dashboard.html")):
        return send_from_directory(portal_dir, "dashboard.html")
    return jsonify({"error": "Dashboard not found"}), 404

# ============================================
# BACKEND PROXY - forwards /api/* to backend
# EXCEPT /api/session/* which is our own
# ============================================
def proxy_to_backend(path, method="GET"):
    """Proxy request to backend"""
    url = f"{BACKEND_URL}/api/{path}"
    try:
        headers = {}
        if "Authorization" in request.headers:
            headers["Authorization"] = request.headers["Authorization"]

        if method == "GET":
            resp = requests.get(url, params=request.args, headers=headers, timeout=10)
        elif method == "POST":
            resp = requests.post(url, json=request.get_json(silent=True), headers=headers, timeout=10)
        elif method == "PUT":
            resp = requests.put(url, json=request.get_json(silent=True), headers=headers, timeout=10)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=10)
        else:
            return jsonify({"error": "method not supported"}), 405

        return Response(resp.content, status=resp.status_code, content_type=resp.headers.get("Content-Type", "application/json"))
    except Exception as e:
        logger.error(f"Proxy error: {e}")
        return jsonify({"error": "backend_unreachable"}), 503

# User auth proxy
@app.route("/api/register", methods=["POST"])
def proxy_register():
    return proxy_to_backend("users/register", "POST")

@app.route("/api/login", methods=["POST"])
def proxy_login():
    return proxy_to_backend("users/login", "POST")

@app.route("/api/logout", methods=["POST"])
def proxy_logout():
    return proxy_to_backend("users/logout", "POST")

@app.route("/api/me", methods=["GET"])
def proxy_me():
    return proxy_to_backend("users/me", "GET")

@app.route("/api/use-feature", methods=["POST"])
def proxy_use_feature():
    return proxy_to_backend("users/use-feature", "POST")

@app.route("/api/users/all", methods=["GET"])
def proxy_users_all():
    return proxy_to_backend("users/all", "GET")

# ============================================
# HEALTH
# ============================================
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "traffic-gateway",
        "active_users": session_manager.get_active_session_count(),
        "timestamp": time.time()
    }), 200

# ============================================
# SESSIONS (own logic - not proxied)
# ============================================
@app.route("/api/session/start", methods=["POST"])
def session_start():
    ip = request.remote_addr
    was_empty = session_manager.get_active_session_count() == 0
    session = session_manager.create_session(ip)

    if was_empty:
        threading.Thread(target=request_scale_up, daemon=True).start()

    ACTIVE_USERS_GAUGE.set(session_manager.get_active_session_count())
    return jsonify({
        "session_id": session["session_id"],
        "active_users": session_manager.get_active_session_count()
    }), 200

@app.route("/api/session/heartbeat", methods=["POST"])
def session_heartbeat():
    data = request.get_json()
    if not data or "session_id" not in data:
        return jsonify({"error": "session_id required"}), 400
    found = session_manager.update_heartbeat(data["session_id"])
    return jsonify({"status": "alive" if found else "not_found"}), 200 if found else 404

@app.route("/api/session/end", methods=["POST"])
def session_end():
    data = request.get_json()
    if not data or "session_id" not in data:
        return jsonify({"error": "session_id required"}), 400
    session_manager.end_session(data["session_id"])
    ACTIVE_USERS_GAUGE.set(session_manager.get_active_session_count())
    return jsonify({"status": "ended"}), 200

@app.route("/api/session/stats", methods=["GET"])
def session_stats():
    stats = session_manager.get_session_stats()
    ACTIVE_USERS_GAUGE.set(stats["active_users"])
    return jsonify(stats), 200

# ============================================
# WORKLOAD PROXY (for load generation)
# ============================================
def forward_to_workload(path, params):
    url = f"{WORKLOAD_URL}/{path.lstrip('/')}"
    start = time.time()
    try:
        resp = requests.get(url, params=params, timeout=10)
        FORWARD_LATENCY.observe(time.time() - start)
        FORWARDED_REQ.labels(status=str(resp.status_code)).inc()
        WORKLOAD_AVAIL.set(1)
        return resp.json(), resp.status_code
    except requests.exceptions.ConnectionError:
        WORKLOAD_AVAIL.set(0)
        FORWARDED_REQ.labels(status="503").inc()
        return {"error": "workload_unavailable", "message": "Cloud is starting up, please wait"}, 503
    except Exception as e:
        FORWARDED_REQ.labels(status="500").inc()
        return {"error": str(e)}, 500

@app.route("/work", methods=["GET"])
def work():
    sid = request.args.get("session_id")
    if sid:
        session_manager.update_heartbeat(sid)
    intensity = request.args.get("intensity", "light")
    data, status = forward_to_workload("work", {"intensity": intensity})
    return jsonify(data), status

@app.route("/metrics", methods=["GET"])
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}

if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("GreenOps Gateway + Portal starting")
    logger.info(f"Workload: {WORKLOAD_URL}")
    logger.info(f"Backend:  {BACKEND_URL}")
    logger.info("=" * 50)
    app.run(host="0.0.0.0", port=GATEWAY_PORT, debug=False)
