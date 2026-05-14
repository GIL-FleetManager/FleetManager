import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from pydantic import BaseModel
from src.consumer import start_consumer, EventDatabase
from typing import Optional


class Event(BaseModel):
    type_event: str
    message: str


class EventLog(BaseModel):
    id: int
    event_type: str
    topic: str
    payload: dict
    timestamp: str
    created_at: str
    source_service: Optional[str] = None
    correlation_id: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(start_consumer())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Consumer stopped.")


app = FastAPI(
    title="Fleet Event Service",
    description="Service de traitement des événements Kafka pour la flotte.",
    version="1.0.0",
    docs_url="/api",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {"service": "Event Service", "status": "Healthy", "documentation": "/api"}


@app.get("/health")
async def health():
    return {"status": "Event service is healthy"}


@app.post("/logs")
async def record_event(event: Event):
    return {"status": "Event logged", "type": event.type_event}


@app.get("/events", response_model=list[EventLog])
async def get_events(
    event_type: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Retrieve events from database with optional filtering"""
    if EventDatabase.pool is None:
        return []

    try:
        async with EventDatabase.pool.acquire() as conn:
            query = "SELECT * FROM logs_events WHERE 1=1"
            params = []

            if event_type:
                query += " AND event_type = $" + str(len(params) + 1)
                params.append(event_type)

            if topic:
                query += " AND topic = $" + str(len(params) + 1)
                params.append(topic)

            query += " ORDER BY created_at DESC LIMIT $" + str(len(params) + 1)
            params.append(limit)
            query += " OFFSET $" + str(len(params) + 1)
            params.append(offset)

            rows = await conn.fetch(query, *params)

            return [
                EventLog(
                    id=row["id"],
                    event_type=row["event_type"],
                    topic=row["topic"],
                    payload=row["payload"],
                    timestamp=row["timestamp"].isoformat()
                    if row["timestamp"]
                    else None,
                    created_at=row["created_at"].isoformat()
                    if row["created_at"]
                    else None,
                    source_service=row["source_service"],
                    correlation_id=row["correlation_id"],
                )
                for row in rows
            ]
    except Exception as e:
        return []


@app.get("/events/stats")
async def event_stats():
    """Get event statistics"""
    if EventDatabase.pool is None:
        return {"status": "Database not initialized"}

    try:
        async with EventDatabase.pool.acquire() as conn:
            stats = await conn.fetch("""
                SELECT 
                    event_type,
                    COUNT(*) as count,
                    MAX(created_at) as last_received
                FROM logs_events
                GROUP BY event_type
                ORDER BY count DESC
            """)

            return {
                "total_events": sum(row["count"] for row in stats),
                "by_type": [
                    {
                        "event_type": row["event_type"],
                        "count": row["count"],
                        "last_received": row["last_received"].isoformat()
                        if row["last_received"]
                        else None,
                    }
                    for row in stats
                ],
            }
    except Exception as e:
        return {"error": str(e)}
