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


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    return {"status": "Event Service is healthy"}


@app.post("/logs")
async def record_event(event: Event):
    return {"status": "Event logged", "type": event.type_event}
