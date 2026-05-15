import json
import asyncio
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


@router.post("/chat")
async def chat(request: ChatRequest):
    messages = [m.model_dump() for m in request.messages]
    queue = asyncio.Queue()

    async def stream_callback(event: dict):
        await queue.put(event)

    async def run_loop():
        try:
            await run_agent_loop(messages, stream_callback=stream_callback)
        finally:
            await queue.put(None)

    async def generate():
        task = asyncio.create_task(run_loop())

        while True:
            event = await queue.get()

            if event is None:
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                break

            yield f"data: {json.dumps(event)}\n\n"

        await task

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )