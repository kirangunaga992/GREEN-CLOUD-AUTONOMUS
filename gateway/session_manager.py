# ============================================
# GreenOps Autonomous - Session Manager
# Tracks active user sessions
# Handles heartbeats and idle detection
# ============================================

import time
import uuid
import logging
import threading

logger = logging.getLogger(__name__)

# ============================================
# In-memory session store
# Format:
# {
#   session_id: {
#     session_id,
#     user_ip,
#     started_at,
#     last_heartbeat,
#     request_count
#   }
# }
# ============================================
_sessions = {}
_lock = threading.Lock()

# Session expires if no heartbeat for this many seconds
SESSION_TIMEOUT_SECONDS = 30


# ============================================
# Create a new session
# ============================================
def create_session(user_ip: str) -> dict:
    """
    Creates a new user session.
    Returns session data with unique session_id.
    """
    session_id = str(uuid.uuid4())
    now = time.time()

    session = {
        "session_id": session_id,
        "user_ip": user_ip,
        "started_at": now,
        "last_heartbeat": now,
        "request_count": 0
    }

    with _lock:
        _sessions[session_id] = session

    logger.info(f"Session created | id={session_id} | ip={user_ip}")
    return session


# ============================================
# Update heartbeat for existing session
# ============================================
def update_heartbeat(session_id: str) -> bool:
    """
    Updates the last_heartbeat timestamp for a session.
    Returns True if session exists, False if not found.
    """
    with _lock:
        if session_id in _sessions:
            _sessions[session_id]["last_heartbeat"] = time.time()
            _sessions[session_id]["request_count"] += 1
            logger.debug(f"Heartbeat updated | id={session_id}")
            return True
        return False


# ============================================
# End a session explicitly
# ============================================
def end_session(session_id: str) -> bool:
    """
    Removes a session when user explicitly disconnects.
    Returns True if session was found and removed.
    """
    with _lock:
        if session_id in _sessions:
            session = _sessions.pop(session_id)
            duration = time.time() - session["started_at"]
            logger.info(
                f"Session ended | id={session_id} "
                f"| duration={duration:.1f}s "
                f"| requests={session['request_count']}"
            )
            return True
        return False


# ============================================
# Clean up expired sessions
# Called by background thread
# ============================================
def cleanup_expired_sessions():
    """
    Removes sessions that have not sent
    a heartbeat within SESSION_TIMEOUT_SECONDS.
    """
    now = time.time()
    expired = []

    with _lock:
        for session_id, session in _sessions.items():
            idle_time = now - session["last_heartbeat"]
            if idle_time > SESSION_TIMEOUT_SECONDS:
                expired.append(session_id)

        for session_id in expired:
            session = _sessions.pop(session_id)
            logger.info(
                f"Session expired | id={session_id} "
                f"| idle={SESSION_TIMEOUT_SECONDS}s exceeded"
            )

    return len(expired)


# ============================================
# Get all active sessions
# ============================================
def get_active_sessions() -> list:
    """
    Returns list of all currently active sessions.
    """
    with _lock:
        return list(_sessions.values())


# ============================================
# Get active session count
# ============================================
def get_active_session_count() -> int:
    """
    Returns count of active sessions.
    """
    with _lock:
        return len(_sessions)


# ============================================
# Get session by ID
# ============================================
def get_session(session_id: str) -> dict | None:
    """
    Returns session data for a given session_id.
    Returns None if not found.
    """
    with _lock:
        return _sessions.get(session_id, None)


# ============================================
# Get summary stats
# ============================================
def get_session_stats() -> dict:
    """
    Returns summary statistics for all sessions.
    """
    with _lock:
        count = len(_sessions)
        total_requests = sum(
            s["request_count"] for s in _sessions.values()
        )
        now = time.time()
        sessions_list = [
            {
                "session_id": s["session_id"],
                "user_ip": s["user_ip"],
                "duration_seconds": round(now - s["started_at"], 1),
                "idle_seconds": round(now - s["last_heartbeat"], 1),
                "request_count": s["request_count"]
            }
            for s in _sessions.values()
        ]

    return {
        "active_users": count,
        "total_requests_in_session": total_requests,
        "sessions": sessions_list
    }