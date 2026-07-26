# ============================================
# Presence WebSocket
# Real-time online/offline tracking
# ============================================
import asyncio
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app import database as db

logger = logging.getLogger(__name__)
router = APIRouter()

# Track active connections per user
_active_users = {}

async def mark_online(user_id: str):
    """Mark user as online in DB."""
    try:
        db.get_db()["users"].update_one(
            {"user_id": user_id},
            {"$set": {
                "is_online": True,
                "last_seen": datetime.now(timezone.utc)
            }}
        )
        logger.info(f"🟢 {user_id} ONLINE")
    except Exception as e:
        logger.error(f"mark_online error: {e}")

async def mark_offline(user_id: str):
    """Mark user as offline in DB."""
    try:
        db.get_db()["users"].update_one(
            {"user_id": user_id},
            {"$set": {
                "is_online": False,
                "last_seen": datetime.now(timezone.utc)
            }}
        )
        logger.info(f"⚪ {user_id} OFFLINE")
    except Exception as e:
        logger.error(f"mark_offline error: {e}")


@router.websocket("/ws/presence/{user_id}")
async def presence_ws(ws: WebSocket, user_id: str):
    await ws.accept()

    # Track this connection
    if user_id not in _active_users:
        _active_users[user_id] = 0
    _active_users[user_id] += 1

    await mark_online(user_id)

    try:
        while True:
            # Keep alive — just wait for anything or ping
            try:
                await asyncio.wait_for(ws.receive_text(), timeout=25)
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await ws.send_text("ping")
                except:
                    break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WS error for {user_id}: {e}")
    finally:
        # Decrement connection count
        _active_users[user_id] = max(0, _active_users.get(user_id, 1) - 1)

        # If NO more connections for this user → offline
        if _active_users.get(user_id, 0) == 0:
            await mark_offline(user_id)
            _active_users.pop(user_id, None)
