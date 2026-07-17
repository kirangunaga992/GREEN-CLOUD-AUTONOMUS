# ============================================
# GreenOps Backend - Database Manager
# MongoDB connection and collection helpers
# ============================================

import logging
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import config

logger = logging.getLogger(__name__)

# ============================================
# MongoDB Client - Single instance
# ============================================
_client = None
_db     = None


def get_db():
    """
    Returns the MongoDB database instance.
    Creates connection if not already connected.
    """
    global _client, _db

    if _db is None:
        try:
            _client = MongoClient(
                config.MONGO_URI,
                serverSelectionTimeoutMS=5000
            )
            # Test connection
            _client.admin.command("ping")
            _db = _client[config.MONGO_DB_NAME]
            logger.info(f"MongoDB connected | db={config.MONGO_DB_NAME}")
            _create_indexes()
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"MongoDB connection failed: {str(e)}")
            raise

    return _db


def _create_indexes():
    """
    Creates indexes for better query performance.
    Called once on startup.
    """
    db = _db

    # Metrics collection - index on timestamp
    db[config.COL_METRICS].create_index(
        [("timestamp", DESCENDING)]
    )

    # Energy collection - index on timestamp
    db[config.COL_ENERGY].create_index(
        [("timestamp", DESCENDING)]
    )

    # Scaling events - index on timestamp
    db[config.COL_SCALING].create_index(
        [("timestamp", DESCENDING)]
    )

    # Predictions - index on timestamp
    db[config.COL_PREDICTIONS].create_index(
        [("timestamp", DESCENDING)]
    )

    logger.info("MongoDB indexes created")


# ============================================
# Helper: Insert one document
# ============================================
def insert_one(collection: str, document: dict):
    """
    Inserts a single document into a collection.
    Automatically adds created_at timestamp.
    """
    db = get_db()
    document["created_at"] = datetime.now(timezone.utc)
    result = db[collection].insert_one(document)
    return str(result.inserted_id)


# ============================================
# Helper: Find many documents
# ============================================
def find_many(
    collection: str,
    query: dict = {},
    sort_field: str = "timestamp",
    sort_order: int = DESCENDING,
    limit: int = 100
) -> list:
    """
    Finds multiple documents from a collection.
    Returns list of documents without _id field.
    """
    db = get_db()
    cursor = db[collection].find(
        query,
        {"_id": 0}
    ).sort(sort_field, sort_order).limit(limit)
    return list(cursor)


# ============================================
# Helper: Find one document
# ============================================
def find_one(collection: str, query: dict) -> dict | None:
    """
    Finds a single document from a collection.
    """
    db = get_db()
    return db[collection].find_one(query, {"_id": 0})


# ============================================
# Helper: Get aggregated sum for today
# ============================================
def get_today_sum(collection: str, field: str) -> float:
    """
    Returns the sum of a field for today's records.
    Used for energy/carbon/cost daily totals.
    """
    db = get_db()
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    pipeline = [
        {
            "$match": {
                "timestamp": {"$gte": today_start}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": f"${field}"}
            }
        }
    ]

    result = list(db[collection].aggregate(pipeline))
    if result:
        return round(result[0]["total"], 6)
    return 0.0


# ============================================
# Helper: Get latest document
# ============================================
def get_latest(collection: str) -> dict | None:
    """
    Returns the most recent document from a collection.
    """
    db = get_db()
    result = db[collection].find_one(
        {},
        {"_id": 0},
        sort=[("timestamp", DESCENDING)]
    )
    return result


# ============================================
# Health check
# ============================================
def ping_db() -> bool:
    """
    Checks if MongoDB is reachable.
    Returns True if healthy.
    """
    try:
        get_db()
        _client.admin.command("ping")
        return True
    except Exception:
        return False