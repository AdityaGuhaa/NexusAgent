import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agent.loop import run_agent_loop

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


async def event_stream(messages: list[dict]):
    events = []

    async def stream_callback(event: dict):
        events.append(event)
        data = json.dumps(event)
        yield f"data: {data}\n\n"

    async for chunk in _run_and_stream(messages, stream_callback):
        yield chunk


async def _run_and_stream(messages: list[dict], callback):
    buffer = []

    async def collect(event: dict):
        data = json.dumps(event)
        buffer.append(f"data: {data}\n\n")

    await run_agent_loop(messages, stream_callback=collect)

    for chunk in buffer:
        yield chunk

    yield "data: {\"type\": \"done\"}\n\n"


@router.post("/chat")
async def chat(request: ChatRequest):
    messages = [m.model_dump() for m in request.messages]

    async def generate():
        buffer = []

        async def stream_callback(event: dict):
            data = json.dumps(event)
            buffer.append(f"data: {data}\n\n")

        await run_agent_loop(messages, stream_callback=stream_callback)

        for chunk in buffer:
            yield chunk

        yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )