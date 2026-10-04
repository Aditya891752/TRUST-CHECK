"""
Claim extractor pipeline module for TrustCheck.
"""

from typing import List, Dict, Any, Optional
from ..providers.anthropic import AnthropicProvider
from ..api.schemas import SpanSchema
from ..core.config import MAX_CLAIMS

async def extract_claims(
    answer: str,
    question: Optional[str] = None,
    provider: Optional[AnthropicProvider] = None
) -> List[Dict[str, Any]]:
    """
    Extracts atomic claims and search queries from the answer.
    Computes character spans against original answer text.
    """
    if provider is None:
        provider = AnthropicProvider()

    raw_claims = await provider.extract_claims_and_queries(answer, question)
    
    extracted = []
    for idx, item in enumerate(raw_claims[:MAX_CLAIMS]):
        claim_id = f"c{idx + 1}"
        text = item.get("text", "").strip()
        quote = item.get("quote", "").strip()
        search_query = item.get("search_query", text).strip()

        if not text:
            continue

        # Locate exact quote in original answer for highlighting (UTF-16 code unit offsets)
        span = None
        if quote:
            start_pos = answer.find(quote)
            if start_pos != -1:
                from ..core.text import codepoint_to_utf16_offset
                u16_start = codepoint_to_utf16_offset(answer, start_pos)
                u16_end = codepoint_to_utf16_offset(answer, start_pos + len(quote))
                span = SpanSchema(start=u16_start, end=u16_end)

        # Extract number, date, and name flags (Feature F6)
        from .flags import build_claim_flags
        model_flags = item.get("flag_terms", [])
        flags = build_claim_flags(text, model_flags)

        extracted.append({
            "id": claim_id,
            "text": text,
            "quote": quote,
            "span": span,
            "search_query": search_query or text,
            "flags": flags
        })

    return extracted
