# TrustCheck Architecture

See architecture-diagram.md for the visual diagram and step-by-step deployment.

## 1. Architecture principles
- Frontend and backend are independently deployable.
- Vercel hosts the React + Vite web app. Render hosts the FastAPI service.
- The browser never receives provider secrets.
- The backend owns AI orchestration, evidence retrieval, validation and rate limiting.
- All model responses are untrusted structured data and are validated before use.
- The MVP avoids unnecessary infrastructure. No database.

## 2. Runtime topology
```text
Browser
  | HTTPS
  v
Vercel: React + Vite app (static files, UI state only)
  | POST /api/v1/check  (JSON)
  v
Render: FastAPI backend
  +--> input validation, origin check, rate limit, daily cap
  +--> claim extraction + search query per claim --> Anthropic Claude API
  +--> evidence retrieval ------------------------> Search provider (Tavily)
  +--> claim verification (parallel per claim) ---> Anthropic Claude API
  +--> response validation and normalization
  v
Structured verification report --> Vercel UI
```

## 3. Deployment split
### Vercel (frontend)
- React + Vite + TypeScript, built to static files in `dist/`.
- UI state and presentation only. No direct calls to Anthropic or the search provider.
- One public runtime value: `VITE_API_BASE_URL` (not a secret).
- Security headers set in `vercel.json`.

### Render (backend)
- Python + FastAPI served by Uvicorn.
- Secrets only in Render environment variables.
- CORS restricted to the deployed Vercel origin(s) plus localhost for development.

### External services
- Anthropic Claude API for language reasoning.
- Search API (Tavily by default, behind a provider interface).
- No database for the core demo. If persistence is added later: private Postgres or Supabase with RLS on and private storage.

## 4. Request lifecycle
### `POST /api/v1/check`
1. Validate request shape and size. Normalize whitespace. Reject empty content.
2. Apply rate limit and daily cap.
3. Extract atomic claims. The same call returns a focused search query per claim.
4. For each claim, in parallel: retrieve bounded evidence, then verify.
5. Validate every model output. Downgrade or fail safely when invalid.
6. Map verdicts to the three allowed states and build one report.

### `GET /api/health`
Returns `{ "status": "ok" }` only. No version or environment details. Used for warm-up and Render health checks.

## 5. API contract (v1)
Request:
```json
{ "answer": "string, 1-4000 chars", "question": "string, optional, max 500 chars" }
```
Response 200:
```json
{
  "request_id": "req_01J...",
  "summary": { "supported": 3, "uncertain": 1, "unsupported": 1 },
  "claims": [
    {
      "id": "c1",
      "text": "Python was first released in 1991.",
      "span": { "start": 0, "end": 63 },
      "verdict": "supported",
      "reasoning": "Official history places the first release in 1991.",
      "evidence": [
        { "id": "e1", "title": "string", "url": "https://...", "snippet": "string", "retrieved_at": "2026-10-04T10:00:00Z" }
      ]
    }
  ]
}
```
- `span` is the character range of the claim's quote in the original answer, used for highlighting. It is `null` when the quote cannot be located, and the claim then appears in the list only.
- `evidence` objects come only from the retrieval layer.

Error shape (never contains a trace):
```json
{ "error": { "code": "rate_limited", "message": "Too many requests. Try again shortly.", "request_id": "req_01J..." } }
```
| Code | HTTP | Meaning |
|------|------|---------|
| `bad_request` | 400 or 422 | Validation failed |
| `rate_limited` | 429 | Per-IP limit hit, includes a retry hint |
| `daily_cap` | 429 | Global daily cap reached |
| `upstream_unavailable` | 502 | Model or search provider failed |
| `timeout` | 504 | Request exceeded the overall limit |
| `internal` | 500 | Unexpected failure, request id only |

## 6. Backend modules
```text
backend/
  app/
    main.py
    api/
      routes.py
      schemas.py
    core/
      config.py        (env vars, model names, limits)
      security.py      (CORS, rate limit, daily cap)
      errors.py        (generic error mapping)
      logging.py
    pipeline/
      claim_extractor.py   (claims + search query per claim)
      evidence_retriever.py
      verifier.py
      report_builder.py
    providers/
      anthropic.py
      search.py            (SearchProvider interface, Tavily implementation)
  tests/
    fixtures/
    test_schemas.py
    test_pipeline_contracts.py
  requirements.txt
```
Filenames may change. The boundaries must not: routes, security and config, pipeline steps, provider adapters, tests.

## 7. Frontend modules (React + Vite)
```text
frontend/
  src/
    main.tsx
    App.tsx
    components/
      CheckForm.tsx
      ProgressStatus.tsx
      HighlightedAnswer.tsx
      SummaryStrip.tsx
      ClaimCard.tsx
      EvidenceList.tsx
      ErrorNotice.tsx
    lib/
      api.ts
      types.ts
      validation.ts
    styles/
      tokens.css
  index.html
  vite.config.ts
  vercel.json
  package.json
```
No business logic in components. `api.ts` is the only file that talks to the backend.

## 8. Failure handling
| Failure | Behavior |
|---------|----------|
| Validation failure | 400 or 422, safe message |
| Rate limit | 429 with retry hint |
| Extraction call fails | 502, friendly message in UI |
| Search fails for one claim | Claim returned as `uncertain`, reasoning says evidence could not be retrieved |
| Verifier returns invalid JSON | One retry, then `uncertain` for that claim |
| Overall request exceeds 25 s | 504 |
| Unhandled exception | Logged server-side with request id, user sees generic `internal` error |

Never return tracebacks, environment values, provider payloads, SQL or file paths.

## 9. Observability
Log: request id, stage name, latency, status, provider error category.
Do not log: API keys, full user answers by default, authorization headers, sensitive content.

## 10. Scaling later
Job queue, persistent database, cached evidence, streaming responses. None are required for the hackathon MVP.
