import uuid
from fastapi import APIRouter, Request
from .schemas import CheckRequest, CheckResponse
from ..core.security import limiter

router = APIRouter()

@router.post("/check", response_model=CheckResponse)
@limiter.limit("5/minute")
async def check_answer(request: Request, payload: CheckRequest):
    req_id = str(uuid.uuid4())
    request.state.request_id = req_id
    
    # Placeholder response
    return CheckResponse(
        request_id=req_id,
        summary={"supported": 0, "uncertain": 0, "unsupported": 0},
        claims=[]
    )
