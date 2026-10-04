# TrustCheck Task Plan (GSD style)

## Operating rule
Build the smallest complete vertical slice first. Every task ends in a testable state and one commit. Do not start optional polish until the end-to-end check flow works. Deploy early so hosting surprises appear first, not last.

## State
- Current phase: 2
- Last verified: Phase 1 repository and deployment skeleton built & tested (FastAPI health returns 200, pytest passes, frontend skeleton in place)
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
- [ ] Define `POST /api/v1/check` request and response schemas (architecture.md section 5).
- [ ] Add Pydantic validation, request IDs, max input length, and the generic error shape.
- [ ] Add the config module for env vars, limits and model names. No key strings in code.
Exit: the contract can be tested without any AI provider. Invalid input returns a generic 400.
Commit: `feat: api contract`

## Phase 3: Backend vertical slice
- [ ] Claim extraction with search query per claim, verbatim quote check.
- [ ] Search provider interface and Tavily adapter with timeout.
- [ ] Evidence normalization with IDs.
- [ ] Parallel per-claim verification with evidence IDs.
- [ ] Validate every model response. Bounded retry (one) for malformed output.
- [ ] Failure path: one failed claim becomes `uncertain`, not a 500.
- [ ] Per-IP rate limit, daily cap, CORS allow-list, safe error handling.
- [ ] Build the evaluation fixtures (aistack.md section 9) and a script that runs them.
Exit: a fixed sample answer returns structured claims and verdicts locally. A fabricated fact is `unsupported`, a correct fact is `supported`, the injection fixture does not change behavior. 20 rapid requests produce 429.
Commit: `feat: verification pipeline`

## Phase 4: Frontend vertical slice
- [ ] Tokens, fonts and spacing scale from design.md.
- [ ] Input form with counter, optional question, sample button, validation.
- [ ] API client (`lib/api.ts`) and progress states.
- [ ] Highlighted answer using claim spans.
- [ ] Summary strip, claim cards, evidence details.
- [ ] Error and empty states with Retry.
- [ ] Wire to the Render API.
Exit: a real request travels from browser to Render and back, and the full report renders.
Commit: `feat: ui`

## Phase 5: Design pass
- [ ] Apply design.md typography and normalize spacing.
- [ ] Remove any banned effects or components (rules.md section B).
- [ ] Check mobile layout.
- [ ] Keyboard and focus states. Verdict visible without color dependency.
- [ ] Contrast check on every text and background pair.
Exit: the UI looks intentional and stable with no banned patterns.
Commit: `chore: design pass`

## Phase 6: Security pass
- [ ] No provider key in client JS (search `dist/`).
- [ ] Search the repo and Git history for secret-like strings (`gitleaks`).
- [ ] `.env*` handling correct. CORS allow-list correct.
- [ ] Rate limiting and daily cap confirmed.
- [ ] Production debug off. `/docs` and `/openapi.json` return 404 on Render.
- [ ] Input limits enforced on the server.
- [ ] Error responses contain no stack traces or paths.
- [ ] No admin routes. Database and storage not used or private.
- [ ] Security headers present on Vercel.
- [ ] `pip-audit` and `npm audit` show no high findings.
Exit: rules.md section C checked line by line, each row PASS or N/A.
Commit: `chore: security pass`

## Phase 7: Demo hardening
- [ ] Prepare 3 to 5 demo inputs, including one mixed-quality answer.
- [ ] Warm up the backend and providers once before presenting.
- [ ] Verify sources render and open correctly.
- [ ] Verify the app behaves clearly when a provider fails.
- [ ] Confirm deployed URLs. Capture screenshots for the PPT.
- [ ] Run the 3 minute demo script twice. Record a backup screen capture.
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
- [ ] User can paste an answer.
- [ ] Claims are extracted.
- [ ] Evidence is retrieved.
- [ ] Verdicts are supported, uncertain or unsupported.
- [ ] Reasoning is shown.
- [ ] Sources are real retrieved sources.
- [ ] Frontend is on Vercel (React + Vite).
- [ ] Backend is on Render (FastAPI).
- [ ] Secrets remain server-side.
- [ ] No banned visual patterns.
- [ ] Demo path is reliable.

## Three highest-risk fixes first
1. Secret exposure audit.
2. Server-side security and rate-limit enforcement.
3. Verification integrity and citation provenance.
