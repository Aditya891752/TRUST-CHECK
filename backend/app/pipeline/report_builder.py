"""
Report builder pipeline module for TrustCheck.
"""

from typing import List, Optional
from ..api.schemas import ClaimSchema, SummarySchema, CheckResponse, Verdict, NoticeSchema, CorrectedAnswerSchema

def build_report(
    request_id: str,
    verified_claims: List[ClaimSchema],
    notices: Optional[List[NoticeSchema]] = None,
    language: str = "en",
    answer_normalized: str = "",
    corrected_answer: Optional[CorrectedAnswerSchema] = None
) -> CheckResponse:
    """
    Builds the final structured CheckResponse report from verified claims.
    Calculates summary counts for each verdict state.
    """
    counts = {
        Verdict.SUPPORTED: 0,
        Verdict.UNCERTAIN: 0,
        Verdict.UNSUPPORTED: 0
    }

    for claim in verified_claims:
        counts[claim.verdict] += 1

    summary = SummarySchema(
        supported=counts[Verdict.SUPPORTED],
        uncertain=counts[Verdict.UNCERTAIN],
        unsupported=counts[Verdict.UNSUPPORTED]
    )

    return CheckResponse(
        request_id=request_id,
        language=language,
        answer_normalized=answer_normalized,
        summary=summary,
        claims=verified_claims,
        notices=notices or [],
        corrected_answer=corrected_answer
    )
