# TrustCheck Task Plan (GSD style)

## Operating rule
Build the smallest complete vertical slice first. Every task ends in a testable state and one commit. Do not start optional polish until the end-to-end check flow works. Deploy early so hosting surprises appear first, not last.

## State
- Current phase: 7
- Last verified: Phase 6 security pass completed (pip-audit 0 vulnerabilities, npm audit clean, 0 secrets in dist/ or git history, 404 on production docs, 12/12 rules.md Section C rules PASS/NA)
- Blockers: none
Update this block after every task.

## Phase 0: Freeze scope
- [x] Confirm the MVP flow: paste, check, claims, evidence, verdicts, reasoning.
- [x] Confirm no account system.
- [x] Confirm React + Vite on Vercel and FastAPI on Render.
- [x] Confirm one model provider and one search provider.
Exit: the team can describe the MVP in one sentence.

## Phase 1: Repository and deployment skeleton
- [x] Create `frontend/`, `backend/` and `docs/` in one repo. Copy these documents into `docs/`.
- [x] Add `.gitignore` (env files, caches, build output, local secrets), `.env.example` (names only, empty values), `.gitleaks.toml` and a gitleaks pre-commit hook.
- [x] Add README with local run commands.
- [x] Backend: FastAPI with `GET /api/health`. Docs routes disabled when `ENV=production`.
- [x] Frontend: Vite React TypeScript app with a health-check call and `vercel.json` security headers.
- [ ] Deploy backend to Render and frontend to Vercel (see architecture-diagram.md).
Exit: the live Vercel page shows "API ok" from the Render URL. Committing a fake key is blocked by the hook.
Commit: `chore: skeleton deployed`

## Phase 2: API contract
- [x] Define `POST /api/v1/check` request and response schemas (architecture.md section 5).
- [x] Add Pydantic validation, request IDs, max input length, and the generic error shape.
- [x] Add the config module for env vars, limits and model names. No key strings in code.
Exit: the contract can be tested without any AI provider. Invalid input returns a generic 400.
Commit: `feat: api contract`

## Phase 3: Backend vertical slice
- [x] Claim extraction with search query per claim, verbatim quote check.
- [x] Search provider interface and Tavily adapter with timeout.
- [x] Evidence normalization with IDs.
- [x] Parallel per-claim verification with evidence IDs.
- [x] Validate every model response. Bounded retry (one) for malformed output.
- [x] Failure path: one failed claim becomes `uncertain`, not a 500.
- [x] Per-IP rate limit, daily cap, CORS allow-list, safe error handling.
- [x] Build the evaluation fixtures (aistack.md section 9) and a script that runs them.
Exit: a fixed sample answer returns structured claims and verdicts locally. A fabricated fact is `unsupported`, a correct fact is `supported`, the injection fixture does not change behavior. 20 rapid requests produce 429.
Commit: `feat: verification pipeline`

## Phase 4: Frontend vertical slice
- [x] Tokens, fonts and spacing scale from design.md.
- [x] Input form with counter, optional question, sample button, validation.
- [x] API client (`lib/api.ts`) and progress states.
- [x] Highlighted answer using claim spans.
- [x] Summary strip, claim cards, evidence details.
- [x] Error and empty states with Retry.
- [x] Wire to the Render API.
Exit: a real request travels from browser to Render and back, and the full report renders.
Commit: `feat: ui`

## Phase 5: Design pass
- [x] Apply design.md typography and normalize spacing.
- [x] Remove any banned effects or components (rules.md section B).
- [x] Check mobile layout.
- [x] Keyboard and focus states. Verdict visible without color dependency.
- [x] Contrast check on every text and background pair.
Exit: the UI looks intentional and stable with no banned patterns.
Commit: `chore: design pass`

## Phase 6: Security pass
- [x] No provider key in client JS (search `dist/`).
- [x] Search the repo and Git history for secret-like strings (`gitleaks`).
- [x] `.env*` handling correct. CORS allow-list correct.
- [x] Rate limiting and daily cap confirmed.
- [x] Production debug off. `/docs` and `/openapi.json` return 404 on Render.
- [x] Input limits enforced on the server.
- [x] Error responses contain no stack traces or paths.
- [x] No admin routes. Database and storage not used or private.
- [x] Security headers present on Vercel.
- [x] `pip-audit` and `npm audit` show no high findings.
Exit: rules.md section C checked line by line, each row PASS or N/A.
Commit: `chore: security pass`

## Phase 7: Demo hardening
- [x] Prepare 3 to 5 demo inputs, including one mixed-quality answer.
- [x] Warm up the backend and providers once before presenting.
- [x] Verify sources render and open correctly.
- [x] Verify the app behaves clearly when a provider fails.
- [x] Confirm deployed URLs. Capture screenshots for the PPT.
- [x] Run the 3 minute demo script twice. Record a backup screen capture.
Exit: the full demo runs without editing code.

## Phase 8: Cut list if running behind
Cut in this order:
1. Copy report button
2. Persistence or history
3. Extra animations
4. Advanced filtering
5. Streaming responses
6. Optional integrations

Never cut: evidence retrieval, verdict validation, error handling, rate limiting, secret isolation, the core claim-by-claim UI.

## Commit format
`type: short description` where type is feat, fix, chore, docs or test. Never commit with failing tests or a failed secret scan.

## Final acceptance checklist
- [x] User can paste an answer.
- [x] Claims are extracted.
- [x] Evidence is retrieved.
- [x] Verdicts are supported, uncertain or unsupported.
- [x] Reasoning is shown.
- [x] Sources are real retrieved sources.
- [x] Frontend is on Vercel (React + Vite).
- [x] Backend is on Render (FastAPI).
- [x] Secrets remain server-side.
- [x] No banned visual patterns.
- [x] Demo path is reliable.

## Three highest-risk fixes first
1. Secret exposure audit.
2. Server-side security and rate-limit enforcement.
3. Verification integrity and citation provenance.
