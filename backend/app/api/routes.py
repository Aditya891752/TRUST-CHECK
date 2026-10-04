"""
API Routes for TrustCheck.
Provides both non-streaming (POST /check) and SSE streaming (POST /check/stream) endpoints.
"""

import json
import asyncio
from typing import List, Any
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from slowapi.util import get_remote_address

from .schemas import (
    CheckRequest,
    CheckResponse,
    NoticeSchema,
    ClaimSchema,
    CorrectedAnswerSchema
)
from ..core.security import limiter, acquire_stream_slot, release_stream_slot
from ..core.config import settings
from ..pipeline.runner import run_check
from ..pipeline.report_builder import build_report

router = APIRouter()

@router.post("/check", response_model=CheckResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def check_answer(request: Request, payload: CheckRequest):
    """
    Standard synchronous verification endpoint.
    Runs the pipeline and returns the complete final structured report.
    """
    req_id = getattr(request.state, "request_id", "req_unknown")
    meta_info: dict = {}
    notices: List[NoticeSchema] = []
    claims: List[ClaimSchema] = []
    corrected_ans = None

    async def collector(event_name: str, data: Any):
        nonlocal meta_info, notices, claims, corrected_ans
        if event_name == "meta":
            meta_info.update(data)
        elif event_name == "notice":
            notices.append(NoticeSchema(**data))
        elif event_name == "claim_result":
            claims.append(ClaimSchema(**data))
        elif event_name == "corrected_answer":
            if data:
                corrected_ans = CorrectedAnswerSchema(**data)

    await run_check(payload, req_id, collector, is_disconnected=request.is_disconnected)

    # Maintain claim ordering
    claims.sort(key=lambda c: int(c.id[1:]) if c.id[1:].isdigit() else 0)

    return build_report(
        req_id,
        claims,
        notices=notices,
        language=meta_info.get("language", "en"),
        answer_normalized=meta_info.get("answer_normalized", payload.answer),
        corrected_answer=corrected_ans
    )

@router.post("/check/stream")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def check_answer_stream(request: Request, payload: CheckRequest):
    """
    Real-time Server-Sent Events (SSE) streaming endpoint (Feature F2).
    Streams progressive lifecycle events:
    meta -> notices -> claims -> claim_result (per claim) -> corrected_answer -> done
    """
    if not settings.STREAMING_ENABLED:
        raise HTTPException(status_code=404, detail="Streaming endpoint is disabled.")

    client_ip = get_remote_address(request)
    if not acquire_stream_slot(client_ip):
        raise HTTPException(status_code=429, detail="Maximum concurrent streams exceeded for your IP.")

    req_id = getattr(request.state, "request_id", "req_unknown")

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        async def stream_emitter(event_name: str, data: Any):
            await queue.put((event_name, data))

        task = asyncio.create_task(
            run_check(payload, req_id, stream_emitter, is_disconnected=request.is_disconnected)
        )

        start_time = asyncio.get_event_loop().time()
        timeout_seconds = settings.STREAM_TIMEOUT_SECONDS

        try:
            while not task.done() or not queue.empty():
                elapsed = asyncio.get_event_loop().time() - start_time
                if elapsed > timeout_seconds:
                    timeout_data = {
                        "error": {
                            "code": "timeout",
                            "message": "Verification stream timed out.",
                            "request_id": req_id
                        }
                    }
                    yield f"event: error\ndata: {json.dumps(timeout_data, ensure_ascii=False)}\n\n"
                    task.cancel()
                    break

                try:
                    event_name, data = await asyncio.wait_for(
                        queue.get(),
                        timeout=min(10.0, max(0.5, timeout_seconds - elapsed))
                    )
                    json_str = json.dumps(data, ensure_ascii=False)
                    yield f"event: {event_name}\ndata: {json_str}\n\n"
                    queue.task_done()
                    if event_name in ("done", "error"):
                        break
                except asyncio.TimeoutError:
                    # Keep-alive comment line every 10s
                    yield ": ping\n\n"
        except asyncio.CancelledError:
            task.cancel()
            raise
        finally:
            if not task.done():
                task.cancel()
            release_stream_slot(client_ip)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )
