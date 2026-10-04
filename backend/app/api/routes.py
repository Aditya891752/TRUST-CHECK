from fastapi import APIRouter, Request
from .schemas import CheckRequest, CheckResponse, SummarySchema
from ..core.security import limiter
from ..core.config import settings
from ..pipeline.claim_extractor import extract_claims
from ..pipeline.evidence_retriever import retrieve_evidence_for_claims
from ..pipeline.verifier import verify_claims
from ..pipeline.report_builder import build_report

router = APIRouter()

@router.post("/check", response_model=CheckResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def check_answer(request: Request, payload: CheckRequest):
    req_id = getattr(request.state, "request_id", "req_unknown")
    
    # 1. Claim extraction and query planning
    claims = await extract_claims(payload.answer, payload.question)
    if not claims:
        return CheckResponse(
            request_id=req_id,
            summary=SummarySchema(supported=0, uncertain=0, unsupported=0),
            claims=[]
        )

    # 2. Parallel evidence retrieval
    evidence_by_claim = await retrieve_evidence_for_claims(claims)

    # 3. Parallel verification
    verified_claims = await verify_claims(claims, evidence_by_claim)

    # 4. Structured report generation
    return build_report(req_id, verified_claims)
