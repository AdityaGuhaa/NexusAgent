# Copyright 2026 Aditya Guha
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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