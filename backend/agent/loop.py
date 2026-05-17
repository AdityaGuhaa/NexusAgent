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
from openai import AsyncOpenAI
from config import LLAMA_SERVER_URL, MODEL_NAME, MAX_TOOL_ITERATIONS, CTX_SIZE
from agent.prompts import build_messages
from agent.parser import extract_tool_calls, get_assistant_text
from tools.registry import execute_tool
from tools.definitions import TOOLS


client = AsyncOpenAI(
    base_url=f"{LLAMA_SERVER_URL}/v1",
    api_key="not-needed"
)


async def run_agent_loop(conversation_history: list[dict], stream_callback=None):
    messages = build_messages(conversation_history)
    iterations = 0

    while iterations < MAX_TOOL_ITERATIONS:
        iterations += 1

        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=CTX_SIZE,
            temperature=0.7,
            stream=False
        )

        raw = response.model_dump()
        tool_calls = extract_tool_calls(raw)
        assistant_text = get_assistant_text(raw)

        if not tool_calls:
            if stream_callback:
                await stream_callback({
                    "type": "text",
                    "content": assistant_text
                })
            return assistant_text

        if stream_callback:
            await stream_callback({
                "type": "tool_call",
                "calls": [{"name": tc["name"], "args": tc["args"]} for tc in tool_calls]
            })

        messages.append({
            "role": "assistant",
            "content": assistant_text or "",
            "tool_calls": [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {
                        "name": tc["name"],
                        "arguments": json.dumps(tc["args"])
                    }
                }
                for tc in tool_calls
            ]
        })

        for tc in tool_calls:
            if stream_callback:
                await stream_callback({
                    "type": "tool_running",
                    "tool": tc["name"],
                    "query": tc["args"].get("query", "")
                })

            result = await execute_tool(tc["name"], tc["args"])

            if stream_callback:
                await stream_callback({
                    "type": "tool_result",
                    "tool": tc["name"],
                    "result": result
                })

            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": result
            })

    if stream_callback:
        await stream_callback({
            "type": "text",
            "content": "I reached the maximum number of search iterations. Here is what I found so far."
        })

    return "Max iterations reached."