"""
Claim verifier pipeline module for TrustCheck.
Executes parallel verification across claims with individual failure isolation.
"""

import asyncio
from typing import List, Dict, Any, Optional
from ..providers.anthropic import AnthropicProvider
from ..api.schemas import ClaimSchema, EvidenceSchema, Verdict

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

        try:
            res = await provider.verify_claim(claim_text, raw_evidence)
            verdict_str = res.get("verdict", "uncertain").lower()
            reasoning = res.get("reasoning", "Evidence inconclusive.")
            cited_ids = set(res.get("evidence_ids", []))

            # Filter evidence to cited items, or all retrieved if none specifically selected
            cited_evidence = []
            for ev in raw_evidence:
                if not cited_ids or ev.get("id") in cited_ids:
                    cited_evidence.append(EvidenceSchema(
                        id=ev.get("id", "e1"),
                        title=ev.get("title", ""),
                        url=ev.get("url", ""),
                        snippet=ev.get("snippet", ""),
                        retrieved_at=ev.get("retrieved_at", "")
                    ))

            # Map verdict
            verdict_map = {
                "supported": Verdict.SUPPORTED,
                "unsupported": Verdict.UNSUPPORTED,
                "uncertain": Verdict.UNCERTAIN
            }
            verdict = verdict_map.get(verdict_str, Verdict.UNCERTAIN)

            # Enforce rule: supported requires at least one cited evidence item
            if verdict == Verdict.SUPPORTED and not cited_evidence:
                verdict = Verdict.UNCERTAIN
                reasoning = "Retrieved evidence was insufficient to firmly support the claim."

            return ClaimSchema(
                id=claim_id,
                text=claim_text,
                span=span,
                verdict=verdict,
                reasoning=reasoning,
                evidence=cited_evidence
            )
        except Exception:
            # Isolated claim failure fallback
            return ClaimSchema(
                id=claim_id,
                text=claim_text,
                span=span,
                verdict=Verdict.UNCERTAIN,
                reasoning="Could not be verified due to a temporary service issue.",
                evidence=[]
            )

    tasks = [verify_single(c, ev) for c, ev in zip(claims, evidence_by_claim)]
    return await asyncio.gather(*tasks)
