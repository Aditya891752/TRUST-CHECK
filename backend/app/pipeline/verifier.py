"""
Claim verifier pipeline module for TrustCheck.
Executes parallel verification across claims with individual failure isolation.
Enforces exact source quotes (F3) and exact figures matching (F6).
"""

import asyncio
import unicodedata
import re
from typing import List, Dict, Any, Optional
from ..providers.anthropic import AnthropicProvider
from ..api.schemas import ClaimSchema, EvidenceSchema, Verdict
from ..core.config import QUOTE_MAX_CHARS

def normalize_text_for_match(text: str) -> str:
    """Normalizes text with NFKC, lowercased, and collapsed whitespace."""
    if not text:
        return ""
    norm = unicodedata.normalize("NFKC", text).lower()
    return re.sub(r"\s+", " ", norm).strip()

def truncate_at_word_boundary(text: str, max_chars: int) -> str:
    """Truncates string to max_chars without cutting inside a word."""
    if len(text) <= max_chars:
        return text
    truncated = text[:max_chars]
    last_space = truncated.rfind(" ")
    if last_space != -1:
        truncated = truncated[:last_space]
    return truncated.rstrip() + "..."

async def verify_claims(
    claims: List[Dict[str, Any]],
    evidence_by_claim: List[List[Dict[str, Any]]],
    provider: Optional[AnthropicProvider] = None
) -> List[ClaimSchema]:
    """
    Verifies claims in parallel against their respective retrieved evidence.
    Single-claim errors fall back gracefully to 'uncertain' without failing the report.
    """
    if provider is None:
        provider = AnthropicProvider()

    async def verify_single(claim: Dict[str, Any], raw_evidence: List[Dict[str, Any]]) -> ClaimSchema:
        claim_id = claim["id"]
        claim_text = claim["text"]
        span = claim.get("span")
        flags = claim.get("flags", [])

        try:
            res = await provider.verify_claim(claim_text, raw_evidence)
            verdict_str = res.get("verdict", "uncertain").lower()
            reasoning = res.get("reasoning", "Evidence inconclusive.")
            ev_evals = res.get("evidence", [])

            # Map evaluated stances and quotes by evidence ID
            eval_by_id = {item.get("id"): item for item in ev_evals if item.get("id")}

            cited_evidence = []
            for ev in raw_evidence:
                eid = ev.get("id", "e1")
                evaluation = eval_by_id.get(eid, {})
                stance = evaluation.get("stance", "neutral")
                raw_quote = evaluation.get("quote")

                # Server verification of quote (F3):
                # Quote must be a verbatim substring of the snippet after NFKC normalization
                verified_quote = None
                if raw_quote:
                    norm_quote = normalize_text_for_match(raw_quote)
                    norm_snippet = normalize_text_for_match(ev.get("snippet", ""))
                    if norm_quote and norm_quote in norm_snippet:
                        # Quote is verified! Truncate at word boundary if over QUOTE_MAX_CHARS
                        verified_quote = truncate_at_word_boundary(raw_quote.strip(), QUOTE_MAX_CHARS)

                cited_evidence.append(EvidenceSchema(
                    id=eid,
                    title=ev.get("title", ""),
                    url=ev.get("url", ""),
                    snippet=ev.get("snippet", ""),
                    retrieved_at=ev.get("retrieved_at", ""),
                    stance=stance,
                    quote=verified_quote
                ))

            # Sort evidence: supports first, then contradicts, then neutral (F3 spec)
            stance_order = {"supports": 0, "contradicts": 1, "neutral": 2}
            cited_evidence.sort(key=lambda x: stance_order.get(x.stance, 3))

            # Map verdict
            verdict_map = {
                "supported": Verdict.SUPPORTED,
                "unsupported": Verdict.UNSUPPORTED,
                "uncertain": Verdict.UNCERTAIN
            }
            verdict = verdict_map.get(verdict_str, Verdict.UNCERTAIN)

            # F3 Rule: 'supported' needs at least one evidence item with stance 'supports'
            has_supporting_evidence = any(ev.stance == "supports" for ev in cited_evidence)
            if verdict == Verdict.SUPPORTED and not has_supporting_evidence:
                verdict = Verdict.UNCERTAIN
                reasoning = "Retrieved sources were insufficient to firmly support the claim."

            # Feature F6: Exact-match check for dates and numbers
            if verdict == Verdict.SUPPORTED and flags:
                from .flags import check_exact_match_downgrade
                # Only check supporting snippets
                sup_snippets = [ev.snippet for ev in cited_evidence if ev.stance == "supports"] or [ev.snippet for ev in cited_evidence]
                match_res = check_exact_match_downgrade(flags, sup_snippets)
                if match_res["downgrade"]:
                    verdict = Verdict.UNCERTAIN
                    reasoning = f"{reasoning} {match_res['note']}".strip()
                elif match_res["note"]:
                    reasoning = f"{reasoning} {match_res['note']}".strip()

            return ClaimSchema(
                id=claim_id,
                text=claim_text,
                span=span,
                verdict=verdict,
                reasoning=reasoning,
                evidence=cited_evidence,
                flags=flags
            )
        except Exception:
            # Isolated claim failure fallback
            return ClaimSchema(
                id=claim_id,
                text=claim_text,
                span=span,
                verdict=Verdict.UNCERTAIN,
                reasoning="Could not be verified due to a temporary service issue.",
                evidence=[],
                flags=flags
            )

    tasks = [verify_single(c, ev) for c, ev in zip(claims, evidence_by_claim)]
    return await asyncio.gather(*tasks)
