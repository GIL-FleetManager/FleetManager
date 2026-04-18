import asyncio
import json
import logging
from aiokafka import AIOKafkaConsumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("event-service")


async def start_consumer():
    bootstrap_servers = "kafka:9092"
    topic = "fleet.vehicle.status"

    consumer = AIOKafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers,
        group_id="event-service-group",
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="earliest",
    )

    await consumer.start()
    logger.info(f"Python Consumer started. Listening on {topic}...")

    try:
        async for msg in consumer:
            data = msg.value

            if data is not None and isinstance(data, dict):
                vehicle_id = data.get("vehicleId", "unknown")
                new_status = data.get("newStatus", "unknown")
                logger.info(f" [KAFKA] Received: Vehicle {vehicle_id} -> {new_status}")
            else:
                logger.warning("Received an empty or invalid Kafka message")

    except Exception as e:
        logger.error(f"Consumer Error: {e}")
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(start_consumer())
