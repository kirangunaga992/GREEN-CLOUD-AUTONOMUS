# ============================================
# WebSocket Live Streaming (JSON-safe)
# ============================================
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app import database as db
from app import metrics_collector as mc
from app.energy_meter import get_today_totals

logger = logging.getLogger(__name__)
router = APIRouter()


def json_safe(obj):
    """Recursively make objects JSON-safe (handle datetime, Decimal, ObjectId)."""
    if isinstance(obj, dict):
        return {k: json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_safe(x) for x in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, "to_decimal"):  # Decimal128
        return float(str(obj))
    if hasattr(obj, "__str__") and not isinstance(obj, (str, int, float, bool, type(None))):
        return str(obj)
    return obj


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        logger.info(f"WS connected. Total: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
        logger.info(f"WS disconnected. Total: {len(self.active)}")

    async def broadcast(self, message: dict):
        safe_msg = json_safe(message)
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(safe_msg))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


def build_live_payload():
    """Collect real-time snapshot for broadcast."""
    try:
        state = mc.get_current_state() or {}
        energy = get_today_totals() or {}
        database = db.get_db()

        users_online = database["users"].count_documents({"is_online": True})
        users_total = database["users"].count_documents({})

        events = list(
            database["scaling_events"]
            .find({}, {"_id": 0})
            .sort("timestamp", -1)
            .limit(5)
        )

        agg = list(database["users"].aggregate([
            {"$group": {
                "_id": None,
                "total_requests": {"$sum": "$total_requests"},
                "total_energy": {"$sum": "$total_energy_kwh"},
                "total_carbon": {"$sum": "$total_carbon_kg"},
                "total_cost": {"$sum": "$total_cost_inr"},
            }}
        ]))
        totals = agg[0] if agg else {}

        payload = {
            "type": "live_update",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metrics": {
                "cpu_percent": round(float(state.get("cpu_percent", 0)), 2),
                "memory_percent": round(float(state.get("memory_percent", 0)), 2),
                "current_rps": round(float(state.get("current_rps", 0)), 2),
                "active_users": int(users_online),
                "current_replicas": int(state.get("current_replicas", 0)),
                "desired_replicas": int(state.get("desired_replicas", 0)),
                "total_requests": int(totals.get("total_requests", 0)),
            },
            "sustainability": {
                "total_energy_kwh": round(float(totals.get("total_energy", 0)), 5),
                "total_carbon_kg": round(float(totals.get("total_carbon", 0)), 5),
                "total_cost_inr": round(float(totals.get("total_cost", 0)), 3),
                "current_power_watts": round(float(energy.get("current_power_watts", 0)), 2),
            },
            "users": {
                "online": int(users_online),
                "total": int(users_total),
            },
            "recent_events": events,
        }
        return json_safe(payload)
    except Exception as e:
        logger.error(f"Live payload error: {e}", exc_info=True)
        return {"type": "error", "message": str(e)}


@router.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            payload = build_live_payload()
            await ws.send_text(json.dumps(payload))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(ws)


async def broadcast_event(event_type: str, data: dict):
    await manager.broadcast({
        "type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    })
