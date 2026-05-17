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

import httpx
from config import SERPER_API_KEY


async def search_serper(query: str, num_results: int = 5) -> list[dict]:
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "q": query,
        "num": num_results
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("organic", [])[:num_results]:
        results.append({
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "snippet": item.get("snippet", "")
        })

    return results


async def search_duckduckgo(query: str, num_results: int = 5) -> list[dict]:
    url = "https://api.duckduckgo.com/"
    params = {
        "q": query,
        "format": "json",
        "no_redirect": "1",
        "no_html": "1"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

    results = []

    if data.get("AbstractText"):
        results.append({
            "title": data.get("Heading", ""),
            "url": data.get("AbstractURL", ""),
            "snippet": data.get("AbstractText", "")
        })

    for topic in data.get("RelatedTopics", [])[:num_results - len(results)]:
        if "Text" in topic and "FirstURL" in topic:
            results.append({
                "title": topic.get("Text", "")[:60],
                "url": topic.get("FirstURL", ""),
                "snippet": topic.get("Text", "")
            })

    return results[:num_results]


async def web_search(query: str, num_results: int = 8) -> list[dict]:
    if SERPER_API_KEY:
        try:
            return await search_serper(query, num_results)
        except Exception as e:
            print(f"[Serper failed] {e} — falling back to DuckDuckGo")

    return await search_duckduckgo(query, num_results)