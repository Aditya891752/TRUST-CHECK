from fastapi import APIRouter, Request
from .schemas import CheckRequest, CheckResponse, SummarySchema
from ..core.security import limiter
from ..core.config import settings

router = APIRouter()

@router.post("/check", response_model=CheckResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def check_answer(request: Request, payload: CheckRequest):
    req_id = getattr(request.state, "request_id", "req_unknown")
    
    # Contract stub response (Phase 2)
    return CheckResponse(
        request_id=req_id,
        summary=SummarySchema(supported=0, uncertain=0, unsupported=0),
        claims=[]
    )
