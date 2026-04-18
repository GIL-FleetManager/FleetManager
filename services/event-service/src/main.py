import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from src.consumer import start_consumer


class Event(BaseModel):
    type_event: str
    message: str


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
