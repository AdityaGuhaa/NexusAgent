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

from tools.web_search import web_search


TOOL_REGISTRY = {
    "web_search": web_search
}


async def execute_tool(tool_name: str, tool_args: dict) -> str:
    if tool_name not in TOOL_REGISTRY:
        return f"Error: Tool '{tool_name}' not found in registry."

    tool_fn = TOOL_REGISTRY[tool_name]

    try:
        results = await tool_fn(**tool_args)
    except Exception as e:
        return f"Error executing tool '{tool_name}': {str(e)}"

    if tool_name == "web_search":
        if not results:
            return "No results found for this query."

        formatted = []
        for i, r in enumerate(results, 1):
            formatted.append(
                f"[{i}] {r['title']}\n"
                f"URL: {r['url']}\n"
                f"Summary: {r['snippet']}\n"
            )
        return "\n".join(formatted)

    return str(results)