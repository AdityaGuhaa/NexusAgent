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
from typing import Optional


def extract_tool_calls(response: dict) -> list[dict]:
    try:
        message = response["choices"][0]["message"]
        tool_calls = message.get("tool_calls")

        if not tool_calls:
            return []

        parsed = []
        for tc in tool_calls:
            tool_name = tc.get("function", {}).get("name", "")
            raw_args = tc.get("function", {}).get("arguments", "{}")

            if not tool_name:
                continue

            try:
                if isinstance(raw_args, str):
                    args = json.loads(raw_args)
                elif isinstance(raw_args, dict):
                    args = raw_args
                else:
                    args = {}
            except json.JSONDecodeError:
                args = extract_args_from_malformed(raw_args)

            parsed.append({
                "id": tc.get("id", f"call_{tool_name}"),
                "name": tool_name,
                "args": args
            })

        return parsed

    except (KeyError, IndexError, TypeError):
        return []


def extract_args_from_malformed(raw: str) -> dict:
    import re

    args = {}

    query_match = re.search(r'"query"\s*:\s*"([^"]+)"', raw)
    if query_match:
        args["query"] = query_match.group(1)

    num_match = re.search(r'"num_results"\s*:\s*(\d+)', raw)
    if num_match:
        args["num_results"] = int(num_match.group(1))

    return args


def get_assistant_text(response: dict) -> Optional[str]:
    try:
        return response["choices"][0]["message"].get("content", "")
    except (KeyError, IndexError, TypeError):
        return ""