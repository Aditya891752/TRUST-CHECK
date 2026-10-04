"""
Search provider interfaces and implementations for TrustCheck.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime, timezone
import httpx
from ..core.config import settings

class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        """Search the web and return normalized evidence dicts."""
        pass

class TavilySearchProvider(SearchProvider):
    def __init__(self, api_key: str | None = None, timeout: float = 8.0):
        self.api_key = api_key or settings.TAVILY_API_KEY
        self.timeout = timeout
        self.endpoint = "https://api.tavily.com/search"

    async def search(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []

        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "basic",
            "include_answer": False,
            "max_results": max_results,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(self.endpoint, json=payload)
                if res.status_code != 200:
                    return []
                data = res.json()
                raw_results = data.get("results", [])
                
                normalized = []
                now = datetime.now(timezone.utc).isoformat()
                for idx, item in enumerate(raw_results):
                    normalized.append({
                        "id": f"e{idx + 1}",
                        "title": item.get("title", "Search Result"),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", "") or item.get("snippet", ""),
                        "retrieved_at": now
                    })
                return normalized
        except Exception:
            # Bounded failure: one search failure must not crash the pipeline
            return []

class MockSearchProvider(SearchProvider):
    """Deterministic mock search provider for offline testing and evaluation fixtures."""
    def __init__(self, custom_results: Dict[str, List[Dict[str, Any]]] | None = None):
        self.custom_results = custom_results or {}

    async def search(self, query: str, max_results: int = 3) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        q_lower = query.lower()
        for k, results in self.custom_results.items():
            if k.lower() in q_lower:
                return results

        # Default fallback results for smoke testing
        if "python" in q_lower and "1991" in q_lower:
            return [{
                "id": "e1",
                "title": "History of Python",
                "url": "https://www.python.org/doc/essays/history/",
                "snippet": "Python was created by Guido van Rossum and first released in 1991.",
                "retrieved_at": now
            }]
        elif "moon" in q_lower and "apollo" in q_lower:
            return [{
                "id": "e1",
                "title": "Apollo 11 Mission Overview",
                "url": "https://www.nasa.gov/mission_pages/apollo/apollo-11.html",
                "snippet": "Apollo 11 landed the first humans on the Moon in July 1969.",
                "retrieved_at": now
            }]
        elif "water" in q_lower and "boil" in q_lower:
            return [{
                "id": "e1",
                "title": "Boiling Point of Water",
                "url": "https://en.wikipedia.org/wiki/Boiling_point",
                "snippet": "At standard atmospheric pressure at sea level, water boils at 100 degrees Celsius.",
                "retrieved_at": now
            }]

        return [{
            "id": "e1",
            "title": f"Reference for {query[:30]}",
            "url": "https://example.com/reference",
            "snippet": f"Documented factual reference regarding {query}.",
            "retrieved_at": now
        }]

def get_search_provider() -> SearchProvider:
    if settings.TAVILY_API_KEY:
        return TavilySearchProvider()
    return MockSearchProvider()
