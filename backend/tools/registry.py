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