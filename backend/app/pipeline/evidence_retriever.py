"""
Evidence retriever pipeline module for TrustCheck.
"""

import asyncio
from typing import List, Dict, Any, Optional
from ..providers.search import SearchProvider, get_search_provider

async def retrieve_evidence_for_claims(
    claims: List[Dict[str, Any]],
    search_provider: Optional[SearchProvider] = None,
    max_evidence_per_claim: int = 3
) -> List[List[Dict[str, Any]]]:
    """
    Retrieves web evidence in parallel for each extracted claim.
    """
    if search_provider is None:
        search_provider = get_search_provider()

    async def fetch_one(claim: Dict[str, Any]) -> List[Dict[str, Any]]:
        query = claim.get("search_query", claim.get("text", ""))
        try:
            return await search_provider.search(query, max_results=max_evidence_per_claim)
        except Exception:
            return []

    tasks = [fetch_one(c) for c in claims]
    return await asyncio.gather(*tasks)
