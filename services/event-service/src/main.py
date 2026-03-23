from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Event(BaseModel):
    type_event: str
    message: str


@app.post("/logs")
async def record_event(event: Event):
    return {"status": "Event logged", "type": event.type_event}
