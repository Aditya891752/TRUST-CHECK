"""
Search provider interfaces and implementations.
"""

from abc import ABC, abstractmethod

class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str) -> list:
        pass

class TavilySearchProvider(SearchProvider):
    async def search(self, query: str) -> list:
        return []
