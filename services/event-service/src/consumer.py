import asyncio
import json
import logging
from datetime import datetime
from aiokafka import AIOKafkaConsumer
import asyncpg
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("event-service")


class EventDatabase:
    """PostgreSQL event storage"""

    pool: Optional[asyncpg.Pool] = None

    @classmethod
    async def initialize(cls, dsn: str) -> None:
        """Initialize the connection pool"""
        cls.pool = await asyncpg.create_pool(dsn, min_size=5, max_size=20)
        logger.info("Database pool initialized")

        # Create table if it doesn't exist
        async with cls.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS logs_events (
                    id SERIAL PRIMARY KEY,
                    event_type VARCHAR(255) NOT NULL,
                    topic VARCHAR(255) NOT NULL,
                    payload JSONB NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    source_service VARCHAR(255),
                    correlation_id VARCHAR(255)
                );
                
                CREATE INDEX IF NOT EXISTS idx_logs_events_timestamp ON logs_events(timestamp);
                CREATE INDEX IF NOT EXISTS idx_logs_events_event_type ON logs_events(event_type);
                CREATE INDEX IF NOT EXISTS idx_logs_events_topic ON logs_events(topic);
            """)
            logger.info("logs_events table is ready")

    @classmethod
    async def store_event(
        cls,
        event_type: str,
        topic: str,
        payload: dict,
        source_service: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> None:
        """Store event in database"""
        if cls.pool is None:
            logger.error("Database pool not initialized")
            return

        try:
            async with cls.pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO logs_events 
                    (event_type, topic, payload, source_service, correlation_id)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    event_type,
                    topic,
                    json.dumps(payload),
                    source_service,
                    correlation_id,
                )
        except Exception as e:
            logger.error(f"Failed to store event: {e}")

    @classmethod
    async def close(cls) -> None:
        """Close the connection pool"""
        if cls.pool:
            await cls.pool.close()


async def start_consumer():
    """Start Kafka consumer listening to all configured topics"""
    bootstrap_servers = "kafka:9092"
    topics = [
        "driver.assigned",
        "vehicle.updated",
        "maintenance.alert",
        "geofence.alert",
        "fleet.vehicle.status",
        "fleet.location.raw",
        "fleet.maintenance.alerts",
        "fleet.system.logs",
    ]

    # Initialize database
    db_host = "db-event"
    db_port = 5432
    db_user = "postgres"
    db_password = "fleetmanager"
    db_name = "fleetmanager"

    dsn = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    await EventDatabase.initialize(dsn)

    consumer = AIOKafkaConsumer(
        *topics,
        bootstrap_servers=bootstrap_servers,
        group_id="event-service-group",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")) if v else None,
        auto_offset_reset="earliest",
    )

    await consumer.start()
    logger.info(f"Kafka consumer started. Listening on topics: {', '.join(topics)}")

    try:
        async for msg in consumer:
            data = msg.value

            if data is None:
                logger.warning(f"Received empty message on topic {msg.topic}")
                continue

            if not isinstance(data, dict):
                logger.warning(
                    f"Received non-dict message on topic {msg.topic}: {type(data)}"
                )
                continue

            # Extract event information
            event_type = data.get("event", "unknown")
            payload = data.get("payload", {})
            timestamp = data.get("timestamp")
            source_service = payload.get("source_service", "unknown")
            correlation_id = payload.get("correlation_id")

            logger.info(f"[{msg.topic}] Event: {event_type} | Data: {payload}")

            # Store in database
            await EventDatabase.store_event(
                event_type=event_type,
                topic=msg.topic,
                payload=data,
                source_service=source_service,
                correlation_id=correlation_id,
            )

    except Exception as e:
        logger.error(f"Consumer Error: {e}")
    finally:
        await consumer.stop()
        await EventDatabase.close()


if __name__ == "__main__":
    asyncio.run(start_consumer())
