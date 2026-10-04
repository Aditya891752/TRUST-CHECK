# TrustCheck Feature Pack: Overview

Put this folder in `docs/features/` of the repo. The project is already being built, so every change here is additive. Read the existing docs first (memory.md, prd.md, architecture.md, aistack.md, rules.md, design.md), then apply the features in the order below.

## 1. The six features
| ID | Feature | Doc | Depends on | Touches | Risk |
|----|---------|-----|------------|---------|------|
| F6 | Number, date and name flags | 06-number-date-flags.md | none | backend, frontend | Low |
| F3 | Exact quote from the source | 03-exact-source-quote.md | none | backend, frontend | Low |
| F5 | Injection test sample and notices | 05-injection-test-sample.md | none | backend, frontend | Low |
| F4 | Hindi and Hinglish input | 04-hindi-hinglish-input.md | none (F6 helps) | backend, frontend | Medium |
| F1 | Corrected answer | 01-corrected-answer.md | F3, F6 recommended | backend, frontend | Medium |
| F2 | Live streaming results | 02-live-streaming.md | all of the above | backend, frontend | Medium |

## 2. Implementation order and why
1. **F6 flags**: small and mostly deterministic. Adds a field the later features reuse.
2. **F3 quotes**: changes the verifier output shape once, before more features depend on it.
3. **F5 injection**: cheap, high demo value, and its notices field is needed by streaming.
4. **F4 Hindi and Hinglish**: touches extraction, verification and highlighting. Do it before correction so the correction call is language-aware from the start.
5. **F1 corrected answer**: one extra model call after verdicts.
6. **F2 streaming**: last, because it changes the transport. The non-streaming endpoint stays as the fallback.

One feature per commit. Run the existing tests and the fixtures in samples-and-fixtures.md after each one.

## 3. Pipeline after all features
```text
normalize answer (Unicode NFC)                        [F4]
scan input for instruction-like text                  [F5]
extraction call: language, claims, queries, flag terms, instruction hint   [F4, F5, F6]
for each claim, in parallel:
    retrieve evidence
    drop snippets that contain instructions           [F5]
    verification call: verdict, reasoning, stance, quotes   [F3, F6]
    server checks: quote is verbatim, figures appear in evidence, evidence IDs real
    emit claim_result                                 [F2]
after all claims:
    correction call, validated                        [F1]
    emit corrected_answer, then done                  [F2]
```

## 4. Contract changes (all new fields are optional)
The frontend must tolerate missing fields so old and new backends both work.

### Request
```json
{ "answer": "string, 1-4000 characters", "question": "string, optional, max 500", "response_language": "auto" }
```
`response_language` is one of `auto`, `en`, `hi`, `hinglish`. Default `auto` follows the input.

### Response (`POST /api/v1/check`)
```json
{
  "request_id": "req_01J...",
  "language": "en",
  "answer_normalized": "string",
  "summary": { "supported": 1, "uncertain": 1, "unsupported": 1 },
  "notices": [
    { "code": "instruction_in_input", "message": "string", "excerpt": "plain text, max 80 chars, optional" }
  ],
  "claims": [
    {
      "id": "c1",
      "text": "string",
      "span": { "start": 0, "end": 63 },
      "flags": [ { "type": "date", "text": "1991", "start": 40, "end": 44 } ],
      "verdict": "supported",
      "reasoning": "string",
      "evidence": [
        {
          "id": "e1", "title": "string", "url": "https://...", "snippet": "string", "retrieved_at": "2026-10-04T10:00:00Z",
          "stance": "supports", "quote": "verbatim sentence from the snippet or null"
        }
      ]
    }
  ],
  "corrected_answer": {
    "text": "string",
    "changes": [ { "claim_id": "c1", "action": "kept" } ]
  }
}
```
- `language`: `en`, `hi` (Devanagari), `hinglish` (Roman script Hindi or mixed), `other`.
- `answer_normalized`: the NFC-normalized answer. All spans refer to this string, in UTF-16 code units so they match JavaScript string indexes.
- `flags[].start` and `end` are offsets inside the claim `text`, also UTF-16 units.
- `stance`: `supports`, `contradicts`, `neutral`. `action`: `kept`, `hedged`, `removed`.
- `corrected_answer` is `null` when correction is disabled, fails validation, or is not applicable.
- `notices[].code`: `instruction_in_input` or `instruction_in_source`.

### Model output shapes (server validates all of them)
Extraction:
```json
{
  "language": "en",
  "instruction_in_input": false,
  "claims": [
    { "text": "string", "quote": "exact substring of the answer", "search_query": "English search query",
      "flag_terms": [ { "type": "date", "text": "1991" } ] }
  ]
}
```
Verification:
```json
{ "verdict": "supported|uncertain|unsupported", "reasoning": "40 words or fewer",
  "evidence": [ { "id": "e1", "stance": "supports|contradicts|neutral", "quote": "verbatim substring of that snippet or null" } ] }
```
Correction:
```json
{ "text": "string", "changes": [ { "claim_id": "c1", "action": "kept|hedged|removed" } ] }
```

### Streaming events (`POST /api/v1/check/stream`)
`meta`, `notice`, `claims`, `claim_result`, `corrected_answer`, `done`, `error`. Full spec in 02-live-streaming.md.

## 5. New config values (backend only, Render env vars)
| Name | Default | Purpose |
|------|---------|---------|
| STREAMING_ENABLED | true | Turn the stream endpoint on or off |
| MAX_CONCURRENT_STREAMS_PER_IP | 2 | Limit open streams per client |
| STREAM_TIMEOUT_SECONDS | 30 | Hard limit for one stream |
| CORRECTION_ENABLED | true | Turn the corrected answer step on or off |
| QUOTE_MAX_CHARS | 200 | Maximum length of a displayed source quote |

No new secret and no new `VITE_*` variable is needed.

## 6. Rules that apply to every feature
- Do not break the existing `POST /api/v1/check` response. New fields are additive.
- Every model output is untrusted. Validate it on the server before use or display.
- The model never outputs URLs. URLs come only from the retrieval layer.
- Render model text as plain text. Never as HTML.
- No secret or provider payload in the browser or in any stream event.
- New endpoints are covered by CORS allow-list, rate limit, daily cap and generic errors.
- No em dashes in UI copy. No banned design pattern (rules.md section B). Color is never the only signal.
- If a feature step fails, degrade that feature, not the whole report. A failed correction means `corrected_answer: null`. A failed quote check means `quote: null`.
- Keep prompts and model names in one place (`core/config.py` and the prompt modules).

## 7. Definition of done for the pack
- All six features work locally and on the deployed Vercel and Render apps.
- Every acceptance test in the six feature docs passes.
- The fixtures in samples-and-fixtures.md pass, including the injection and Hinglish ones.
- Security pass repeated: rules.md section C rows 1, 6, 7, 9, 11 re-checked on the stream endpoint.
- No new dependency added unless it is justified in the commit message.
- memory.md updated (section 8 below).

## 8. Lines to add to memory.md after the pack is applied
- Standout features added: corrected answer, live streaming, exact source quote, Hindi and Hinglish input, injection test sample, number and date flags.
- New endpoint: `POST /api/v1/check/stream`. Non-streaming endpoint stays as fallback.
- Spans are UTF-16 offsets into `answer_normalized`.
- Hindi text uses Noto Sans Devanagari, self-hosted.
