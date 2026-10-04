from typing import List
from fastapi import APIRouter, Request
from .schemas import CheckRequest, CheckResponse, SummarySchema, NoticeSchema
from ..core.security import limiter
from ..core.config import settings
from ..core.injection import scan_for_injection
from ..pipeline.claim_extractor import extract_claims
from ..pipeline.evidence_retriever import retrieve_evidence_for_claims
from ..pipeline.verifier import verify_claims
from ..pipeline.report_builder import build_report

router = APIRouter()

@router.post("/check", response_model=CheckResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def check_answer(request: Request, payload: CheckRequest):
    req_id = getattr(request.state, "request_id", "req_unknown")
    notices: List[NoticeSchema] = []

    # 0. Unicode NFC normalization and language detection (Feature F4)
    from ..core.text import normalize_to_nfc, detect_language, resolve_response_language
    answer_norm = normalize_to_nfc(payload.answer)
    detected_lang = detect_language(answer_norm)
    target_lang = resolve_response_language(payload.response_language, detected_lang)

    # 1. Scan normalized input for prompt injection
    input_matches = scan_for_injection(answer_norm)
    if input_matches:
        notices.append(NoticeSchema(
            code="instruction_in_input",
            message="This text contains instructions aimed at the checker. They were ignored and treated as plain text.",
            excerpt=input_matches[0]["excerpt"]
        ))
    
    # 2. Claim extraction and query planning
    claims = await extract_claims(answer_norm, payload.question)
    if not claims:
        return build_report(
            req_id,
            [],
            notices=notices,
            language=detected_lang,
            answer_normalized=answer_norm
        )

    # 3. Parallel evidence retrieval
    raw_evidence_by_claim = await retrieve_evidence_for_claims(claims)

    # 4. Scan and filter out tainted evidence sources (Feature F5)
    clean_evidence_by_claim = []
    excluded_count = 0
    first_source_excerpt = None

    for ev_list in raw_evidence_by_claim:
        clean_ev = []
        for ev in ev_list:
            text_to_scan = f"{ev.get('title', '')} {ev.get('snippet', '')}"
            source_matches = scan_for_injection(text_to_scan)
            if source_matches:
                excluded_count += 1
                if not first_source_excerpt:
                    first_source_excerpt = source_matches[0]["excerpt"]
            else:
                clean_ev.append(ev)
        clean_evidence_by_claim.append(clean_ev)

    if excluded_count > 0:
        msg = (
            "A retrieved source contained instructions and was excluded."
            if excluded_count == 1
            else f"{excluded_count} retrieved sources contained instructions and were excluded."
        )
        notices.append(NoticeSchema(
            code="instruction_in_source",
            message=msg,
            excerpt=first_source_excerpt
        ))

    # 5. Parallel verification with sanitized evidence and target response language
    verified_claims = await verify_claims(
        claims,
        clean_evidence_by_claim,
        response_language=target_lang
    )

    # 6. Generate corrected answer draft (Feature F1)
    from ..pipeline.corrected_answer import generate_corrected_answer
    corrected_ans = await generate_corrected_answer(
        answer_norm,
        verified_claims,
        language=target_lang
    )

    # 7. Structured report generation with notices, language, normalized answer, and corrected draft
    return build_report(
        req_id,
        verified_claims,
        notices=notices,
        language=detected_lang,
        answer_normalized=answer_norm,
        corrected_answer=corrected_ans
    )
