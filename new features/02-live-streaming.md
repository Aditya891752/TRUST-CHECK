# F2: Live Streaming Results

## Purpose
Show progress and results as they happen instead of one long wait. Claims appear first, each verdict fills in as soon as it is ready, then the corrected answer.

## User-visible behavior
- After pressing Check, the status line updates: "Extracting claims", then "Checking claims: 3 of 7 done".
- As soon as extraction finishes, the claim list appears with each card in a "Checking" state.
- Each card flips to its verdict when ready. The summary strip counts update live.
- A Cancel button stops the request.
- If streaming fails before any claim arrives, the app retries once with the normal non-streaming endpoint and shows the result when it returns.
- Respect `prefers-reduced-motion`. No decorative animation. A skeleton or plain "Checking" text is enough.

## Endpoint
`POST /api/v1/check/stream`. Same request body as `POST /api/v1/check`. The old endpoint stays and is the fallback.

Response headers:
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `X-Accel-Buffering: no`
- `Connection: keep-alive`

Use FastAPI `StreamingResponse` with an async generator. No extra library.

## Event format
Each event is `event: <name>` then `data: <json>` then a blank line. Send a comment line `: ping` every 10 seconds to keep the connection alive.

| Event | Data | When |
|-------|------|------|
| `meta` | `{ request_id, language, answer_normalized }` | first |
| `notice` | notice object (see overview) | zero or more, early |
| `claims` | `{ claims: [ { id, text, span, flags } ] }` | after extraction |
| `claim_result` | full claim object with verdict, reasoning, evidence | once per claim, in completion order |
| `corrected_answer` | corrected answer object or `null` | after all claims |
| `done` | `{ summary }` | last on success |
| `error` | `{ error: { code, message, request_id } }` | terminal on failure |

Rules:
- Exactly one of `done` or `error` ends the stream.
- Event payloads never contain secrets, stack traces, provider payloads or raw model output.
- `claim_result` payloads are validated with the same schema as the non-streaming response.

## Backend changes
1. Refactor the pipeline into one function: `run_check(request, emit)` where `emit` is an async callback. The non-streaming route collects emitted events into the final response. The stream route yields them.
2. Per-claim work runs as parallel tasks. Each task emits its own `claim_result` when finished. A failed claim emits a valid `claim_result` with `verdict: uncertain` and a clear reasoning.
3. Stop work when the client disconnects (`await request.is_disconnected()` check between stages) and cancel pending tasks to save cost.
4. Limits: the stream counts as one request for rate limit and daily cap. `MAX_CONCURRENT_STREAMS_PER_IP` (default 2) is enforced. Hard timeout `STREAM_TIMEOUT_SECONDS` (default 30), then emit `error` with code `timeout`.
5. Disable response compression (for example `GZipMiddleware`) on the stream route, because it buffers events.
6. CORS, origin check, input validation and generic errors apply exactly as for the normal endpoint. Validation errors before the stream starts return a normal JSON 400 or 429, not a stream.
7. `STREAMING_ENABLED=false` makes the stream route return 404, and the frontend falls back to the normal endpoint.

## Frontend changes
- New `lib/stream.ts`: `checkStream(request, handlers, signal)` using `fetch` with `ReadableStream` and `TextDecoder`. `EventSource` cannot send POST bodies, so do not use it.
- The parser must handle events split across chunks, multiple events in one chunk, comment lines, and an unexpected close (treated as an error).
- `App.tsx` state: `claims` map by id, `status`, `doneCount`, `notices`, `correctedAnswer`. Cards render from the map and update in place.
- Use `AbortController` for Cancel and when starting a new check.
- Fallback: if the stream errors before the `claims` event, call `lib/api.ts` non-streaming once. After `claims` has arrived, show a Retry instead of silently restarting.
- Summary strip and status derive from state, not from separate events.

## Acceptance tests
1. Local: the sample answer shows claims first, then verdicts one by one, then corrected answer, then done.
2. Deployed on Render and Vercel: events arrive progressively, not all at the end (check in the browser network tab). If they arrive together, find the buffering layer (compression, proxy header).
3. Cancel stops the backend work (check logs for cancelled tasks).
4. Kill the backend during a stream: the UI shows a generic error with Retry, no trace.
5. Open more than `MAX_CONCURRENT_STREAMS_PER_IP` streams: the extra one gets 429.
6. 20 rapid requests to the stream route: 429 after the limit.
7. `STREAMING_ENABLED=false`: the app still works through the normal endpoint.
8. Chunk-split test for the parser (unit test with events split mid-line).

## Files likely touched
`backend/app/api/routes.py`, `backend/app/pipeline/` (runner refactor), `backend/app/core/security.py` (concurrency limit), `backend/app/core/config.py`, `backend/tests/`, `frontend/src/lib/stream.ts` (new), `frontend/src/lib/api.ts`, `frontend/src/lib/types.ts`, `frontend/src/App.tsx`, `frontend/src/components/ClaimCard.tsx`, `frontend/src/components/ProgressStatus.tsx`, `frontend/src/components/SummaryStrip.tsx`.

## Do not
- Do not remove or change the non-streaming endpoint.
- Do not send partial or unvalidated model output to the browser.
- Do not add WebSockets or a queue. Server-sent events over fetch are enough.
