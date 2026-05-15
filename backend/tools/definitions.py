TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current, real-time, or recent information. Use this when the user asks about recent events, news, live data, or anything that may have changed recently.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to look up. Be specific and concise."
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "Number of results to return. Default is 5.",
                        "default": 8
                    }
                },
                "required": ["query"]
            }
        }
    }
]