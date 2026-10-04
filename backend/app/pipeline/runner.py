"""
Pipeline runner module for TrustCheck (Feature F2).
Executes the verification pipeline, emitting progressive lifecycle events
for live streaming or aggregating for the non-streaming endpoint.
"""

import asyncio
import logging
from typing import Callable, Awaitable, Dict, Any, List, Optional
from ..api.schemas import CheckRequest, ClaimSchema, Verdict, NoticeSchema
from ..core.text import normalize_to_nfc, detect_language, resolve_response_language
from ..core.injection import scan_for_injection
from ..pipeline.claim_extractor import extract_claims
from ..pipeline.evidence_retriever import retrieve_evidence_for_claims
from ..pipeline.verifier import verify_claims
from ..pipeline.corrected_answer import generate_corrected_answer

logger = logging.getLogger(__name__)

async def run_check(
    payload: CheckRequest,
    req_id: str,
    emit: Callable[[str, Dict[str, Any]], Awaitable[None]],
    is_disconnected: Optional[Callable[[], Awaitable[bool]]] = None
):
    """
    Executes the end-to-end check pipeline, emitting real-time events.
    Events emitted:
    - 'meta': { request_id, language, answer_normalized }
    - 'notice': { code, message, excerpt }
    - 'claims': { claims: [ { id, text, span, flags } ] }
    - 'claim_result': full ClaimSchema dict (emitted as each claim finishes)
    - 'corrected_answer': CorrectedAnswerSchema dict or None
    - 'done': { summary }
    - 'error': { error: { code, message, request_id } }
    """
    notices_emitted = set()

    async def check_disconnect():
        if is_disconnected and await is_disconnected():
            raise asyncio.CancelledError("Client disconnected")

    try:
        # 1. Normalization and language resolution
        answer_norm = normalize_to_nfc(payload.answer)
        detected_lang = detect_language(answer_norm)
        target_lang = resolve_response_language(payload.response_language, detected_lang)

        await emit("meta", {
            "request_id": req_id,
            "language": detected_lang,
            "answer_normalized": answer_norm
        })
        await check_disconnect()

        # 2. Input injection scan
        input_matches = scan_for_injection(answer_norm)
        if input_matches:
            notice_data = {
                "code": "instruction_in_input",
                "message": "This text contains instructions aimed at the checker. They were ignored and treated as plain text.",
                "excerpt": input_matches[0]["excerpt"]
            }
            notices_emitted.add("instruction_in_input")
            await emit("notice", notice_data)

        # 3. Claims extraction
        claims = await extract_claims(answer_norm, payload.question)
        await check_disconnect()

        if not claims:
            await emit("claims", {"claims": []})
            await emit("done", {"summary": {"supported": 0, "uncertain": 0, "unsupported": 0}})
            return

        # Emit discovered claims
        claims_meta = []
        for c in claims:
            span_val = c.get("span").model_dump() if c.get("span") else None
            flags_val = [f.model_dump() for f in c.get("flags", [])]
            claims_meta.append({
                "id": c["id"],
                "text": c["text"],
                "span": span_val,
                "flags": flags_val
            })
        await emit("claims", {"claims": claims_meta})
        await check_disconnect()

        # 4. Parallel per-claim evidence retrieval & verification with progressive emission
        verified_claims: List[ClaimSchema] = [None] * len(claims)

        async def process_single_claim(idx: int, claim: Dict[str, Any]):
            await check_disconnect()
            try:
                # 4a. Retrieve evidence for this single claim
                raw_evidence_list = await retrieve_evidence_for_claims([claim])
                raw_ev = raw_evidence_list[0] if raw_evidence_list else []

                # 4b. Filter tainted sources
                clean_ev = []
                for ev in raw_ev:
                    text_to_scan = f"{ev.get('title', '')} {ev.get('snippet', '')}"
                    s_matches = scan_for_injection(text_to_scan)
                    if s_matches:
                        if "instruction_in_source" not in notices_emitted:
                            notices_emitted.add("instruction_in_source")
                            await emit("notice", {
                                "code": "instruction_in_source",
                                "message": "A retrieved source contained instructions and was excluded.",
                                "excerpt": s_matches[0]["excerpt"]
                            })
                    else:
                        clean_ev.append(ev)

                await check_disconnect()

                # 4c. Verify claim
                verified_list = await verify_claims(
                    [claim],
                    [clean_ev],
                    response_language=target_lang
                )
                verified = verified_list[0]
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.warning("Error verifying claim %s: %s", claim.get("id"), str(e))
                verified = ClaimSchema(
                    id=claim.get("id", f"c{idx+1}"),
                    text=claim.get("text", ""),
                    span=claim.get("span"),
                    verdict=Verdict.UNCERTAIN,
                    reasoning="Could not be verified due to a temporary service issue.",
                    evidence=[],
                    flags=claim.get("flags", [])
                )

            verified_claims[idx] = verified
            await emit("claim_result", verified.model_dump())

        tasks = [process_single_claim(idx, c) for idx, c in enumerate(claims)]
        await asyncio.gather(*tasks)
        await check_disconnect()

        # 5. Generate corrected answer draft
        corrected_ans = await generate_corrected_answer(
            answer_norm,
            verified_claims,
            language=target_lang
        )
        await emit("corrected_answer", corrected_ans.model_dump() if corrected_ans else None)
        await check_disconnect()

        # 6. Terminal 'done' event with summary counts
        summary = {
            "supported": sum(1 for c in verified_claims if c and c.verdict == Verdict.SUPPORTED),
            "uncertain": sum(1 for c in verified_claims if c and c.verdict == Verdict.UNCERTAIN),
            "unsupported": sum(1 for c in verified_claims if c and c.verdict == Verdict.UNSUPPORTED),
        }
        await emit("done", {"summary": summary})

    except asyncio.CancelledError:
        logger.info("Pipeline cancelled for request %s", req_id)
        raise
    except Exception as e:
        logger.exception("Unexpected error in pipeline runner for %s", req_id)
        await emit("error", {
            "error": {
                "code": "internal_error",
                "message": "Verification could not be completed.",
                "request_id": req_id
            }
        })
