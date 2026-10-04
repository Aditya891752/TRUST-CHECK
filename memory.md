# TrustCheck Memory

## Purpose
Durable context for any AI coding agent or teammate. Read it before changing the project. Update it at the end of every phase.

## Event context
- Offline hackathon (Vibeathon, Galgotias University).
- PPT due 2 Oct 2026, 10:00 AM. Live round 4 Oct 2026.
- Team: Galactic Debuggers (Aditya Singh Chauhan, Muneer Ahamad, Ankit Kumar Mishra).

## Product
TrustCheck is an AI answer reliability checker.
Core flow: **AI answer, claims, evidence retrieval, claim verification, supported / uncertain / unsupported, reasoning**.

## Decisions made
- TrustCheck was chosen from a shortlist (PhishLens, PR Explainer, RepoMap, TrustCheck, Concept Mentor, ProofStamp).
- Scope Freeze Confirmed: No custom ML model training. The 2,000+ facts dataset will be utilized as an offline benchmark/evaluation test suite to evaluate and benchmark verification accuracy, adhering strictly to PRD non-goals and Claude API + Tavily architecture.
- Frontend: React + Vite + TypeScript on Vercel. Never owns AI or search secrets.
- Backend: Python + FastAPI on Render. Owns AI and search integrations, validation, rate limiting and provider secrets.
- Frontend and backend stay separate in one monorepo named `AI-TRUSTCHECK`.
- Branching strategy: Complete all phased tasks on `master` first; create a separate branch for post-MVP improvements and redesigns.
- Models: Claude. Haiku for extraction and Sonnet for verification as the starting choice, names kept in config only.
- Search: Tavily behind a provider interface.
- Tools: VS Code, Git and GitHub. Languages: Python, TypeScript, JavaScript, HTML, CSS.
- No database and no accounts in v1. Optional Supabase or Postgres only if a concrete need appears.
- Light mode only for v1. Verdict is never color alone.
- API: `POST /api/v1/check`, `GET /api/health`. Query planning lives inside the extraction call.

## Product truth rules
- Never imply a model can establish truth without evidence.
- Evidence is retrieved independently of the model.
- `uncertain` is a first-class outcome.
- The verifier cannot invent citations.
- Retrieved text is untrusted data and may contain prompt injection.

## Design rules (summary)
No purple-to-blue gradients, gradient hero text, emojis in headings, Inter everywhere, colored-border cards, glassmorphism, low-contrast dark mode, three icon boxes in a row, badge above the headline, Lucide everywhere, untouched Shadcn, fade-in on scroll, cursor-following beams, fade-only button hover, inconsistent spacing, habitual em dashes, generic passwords, serif italic accents, Space Grotesk with Instrument Serif, grain over gradients. Full table in rules.md section B.

## Security rules (summary)
1. No secrets in frontend or client JS.
2. No exposed or committed env or config secrets.
3. No secrets in Git history.
4. No permissive database rules or RLS off.
5. No public storage buckets for protected data.
6. Rate limiting on APIs and auth.
7. No debug or dev tooling in production.
8. No unprotected admin routes.
9. No injection through unsanitized input.
10. No plaintext or weak password hashing.
11. No stack traces or internal errors shown to users.
12. No client-only auth checks.
Full table with checks in rules.md section C.

## Working style for AI agents
- Read PRD, architecture, rules and task before substantial code changes.
- Prefer small, reviewable changes. Preserve API contracts unless deliberately changing them.
- Do not expand scope. Do not invent infrastructure the MVP does not need.

## Files in the doc set
| File | Contents |
|------|----------|
| prd.md | Requirements, scope, acceptance criteria, demo script |
| architecture.md | Topology, API contract, modules, failure handling |
| architecture-diagram.md | Diagram and step-by-step Vercel and Render deploy |
| architecture_diagram.png and .svg | The runtime architecture diagram |
| techstack.md | Stack, repo layout, env vars, deployment contract |
| aistack.md | AI responsibilities, contracts, validation, injection defense |
| rules.md | Agent behavior, design bans, 12 security rules, top three fixes |
| design.md | Tokens, type, spacing, components |
| task.md | Phased task list with state |
| memory.md | This file |

## Current status
- Git repository initialized locally in `d:\Vibeathon` (`master` branch).
- Phase 0 (Scope Freeze) completed.
- Phase 1 (Repository and Deployment Skeleton) completed and committed (`0fbd8e9`).
- Phase 2 (API Contract & Pydantic Validation) completed and committed (`e5af766`).
- Phase 3 (Backend Vertical Slice) completed and committed (`7aefe14`).
- Phase 4 (Frontend Vertical Slice) completed:
  - Design tokens strictly implemented in `tokens.css` with 4px grid and WCAG AA contrast colors.
  - Interactive input form (`CheckForm.tsx`) with character counter, validation, sample answer pre-fill, and instant button hover swap.
  - Progress bar (`ProgressStatus.tsx`) with stage labels.
  - Summary strip (`SummaryStrip.tsx`) with single-line verdict breakdown and proportional solid segmented bar.
  - Highlighted answer component (`HighlightedAnswer.tsx`) mapping claim character spans with interactive click-to-scroll to claims.
  - Claim cards (`ClaimCard.tsx`) with dual text + shape markers (`●`, `◐`, `■`) and expandable evidence drawers (`EvidenceList.tsx`).
  - Error notice with request ID and Retry action (`ErrorNotice.tsx`).
  - Frontend compiled and bundled cleanly with Vite (`dist/` verified).
  - Secret scanning on `dist/` verified zero leaked API keys.
  - Vitest test suite passing 100%.
- Phase 5 (Design Pass & Accessibility Audit) completed:
  - Spacing scale normalized strictly to base-4 multiples.
  - Zero banned patterns detected (no gradients, no glassmorphism, no Inter, no emojis, no em dashes).
  - High-contrast editorial palette audited and confirmed passing WCAG AA (up to 15.4:1 contrast).
  - Verdict markers provide dual text + shape representation (`● Supported`, `◐ Uncertain`, `■ Unsupported`), ensuring color is never the only signal.
  - Accessible 2px keyboard focus ring added across all interactive elements.
  - Mobile responsiveness verified for single-column layouts and fluid inputs.
- Phase 6 (Security Pass & Vulnerability Remediation) completed:
  - Audited client bundle (`frontend/dist/`): 0 provider secrets or keys found.
  - Audited Git history (`git log -p`): 0 secrets committed.
  - Confirmed `.env` exclusion: only `.env.example` tracked.
  - Rate limiting confirmed: 5 req/min with HTTP 429 response.
  - Production security verified: `/docs`, `/redoc`, `/openapi.json` return 404 when `ENV=production`.
  - Server-side input validation caps enforced (4,000 char answer, 500 char question, max 8 claims).
  - Production error safety verified: 0 stack traces or file paths leaked.
  - Zero admin routes verified.
  - Vercel security headers verified (`vercel.json`).
  - Upgraded vulnerable dependencies: `pip-audit` reports 0 vulnerabilities; `npm audit` reports 0 high/critical issues.
  - 12/12 security rules in `rules.md` Section C verified PASS or N/A.
- Phase 7 (Demo Hardening) completed:
  - Prepared 5 structured evaluation fixtures in `backend/tests/fixtures/eval_fixtures.json`.
  - Built-in one-click demo sample answer available in `CheckForm.tsx`.
  - Created `docs/demo_guide.md` with 3-minute presentation script, warm-up commands, and offline fallback strategy.
  - Final acceptance criteria confirmed: paste -> claims -> evidence -> verdicts -> reasoning -> highlights -> UI display.
  - Initial baseline completed on `master` branch.
- Pre-commit secret scanning hook active.
- Branch `improvements-and-redesign` active.
- Trained Machine Learning Model (`trustcheck_trained_model`) extracted to `backend/models/trustcheck_trained_model/`.
- Local inference engine implemented in `backend/app/pipeline/local_ml_verifier.py`.
- Feature F6 (Number, Date, and Name Flags) completed:
  - Regex + Model term detection for dates, numbers, and names in `pipeline/flags.py`.
  - Exact-match downgrade check implemented in `verifier.py` (missing figures downgrade `supported` to `uncertain`).
  - FlagSchema and flags added to API contract.
  - Frontend `FlagChips.tsx` created and underlined terms rendered in `ClaimCard.tsx`.
  - 24/24 backend pytest tests passing, 4/4 Vitest tests passing, Vite builds cleanly.

- Feature F3 (Exact Source Quotes) completed:
  - Extended verification contract with `stance` ('supports', 'contradicts', 'neutral') and verbatim `quote`.
  - Implemented server-side deterministic quote substring validation against snippet after NFKC normalization.
  - Implemented word-boundary quote truncation at `QUOTE_MAX_CHARS` (200).
  - Enforced verdict rule: `supported` requires at least one evidence item with stance `supports`.
  - Evidence list ordered by stance: supports, contradicts, neutral.
  - Created frontend `QuoteBlock.tsx` emphasizing verified quotes inside snippets with WCAG AA stance badges.
  - 28/28 backend pytest tests passing, 4/4 Vitest tests passing, Vite builds cleanly.

- Feature F5 (Injection Notices and Test Sample) completed:
  - Regex pattern scanner in `backend/app/core/injection.py` covering English, Hinglish, and Hindi adversarial prompts.
  - Automatic detection in input emits `instruction_in_input` notice with clean sanitized excerpt (max 80 chars).
  - Tainted evidence detection in retrieved snippets drops malicious sources and emits `instruction_in_source` notice.
  - NoticeSchema and notices array added to API contracts (`CheckResponse`).
  - Frontend `NoticeBanner.tsx` created and rendered above report; "Injection test" sample button added to `CheckForm.tsx`.
  - Comprehensive unit and differential tests passing (34/34 pytest, 4/4 vitest, clean Vite build).

- Feature F4 (Hindi and Hinglish Support) completed:
  - Unicode NFC normalization in `backend/app/core/text.py` and `answer_normalized` returned in API response.
  - UTF-16 code unit offset helper (`codepoint_to_utf16_offset`, `utf16_span`) for JavaScript-precise span and flag offsets with astral emoji and Devanagari characters.
  - Multilingual language detection (`detect_language` for 'hi', 'hinglish', 'en') and `response_language` routing ('auto', 'en', 'hi', 'hinglish').
  - Claims preserve user script/wording; reasoning delivered in requested language.
  - Support for Devanagari full stop (। and ॥) in claim segmentation and Devanagari numerals in flags.
  - Frontend: `Noto Sans Devanagari` in font stack, line-height 1.7 for `:lang(hi)`, `ResponseLanguage.tsx` segmented control, and sample buttons for Hindi and Hinglish.
  - 42/42 backend pytest tests passing, 4/4 Vitest tests passing, clean Vite production build.

- Feature F1 (Corrected Answer) completed:
  - Created `backend/app/pipeline/corrected_answer.py` generating a factual rewritten draft from checked claims.
  - Enforced deterministic server-side safety validation:
    - Consistency: `supported` claims must be `kept`, `uncertain` may be `hedged` or `removed`, `unsupported` must be `removed`.
    - Blocking hallucinated figures: every number/date token in draft must exist in original answer.
    - Zero URLs, links, or HTML tags permitted.
    - Length boundary (1.2x + 100 chars) and language script consistency enforced.
  - Safe fallback: any model or validation failure returns `null` without failing the report.
  - Added `CORRECTION_ENABLED` toggle in `config.py`.
  - Frontend: `CorrectedAnswer.tsx` rendered below claims list with clean draft copy button, textual action badges (`[Softened]`, `[Removed]`), and 'No changes needed' banner for all-supported claims.
  - 49/49 backend pytest tests passing, 4/4 Vitest tests passing, clean Vite build.
- Feature F2 (Live Streaming SSE Results) completed:
  - Backend streaming endpoint `POST /api/v1/check/stream` streaming Server-Sent Events (`meta`, `notice`, `claims`, `claim_result`, `corrected_answer`, `done`, `error`) with `: ping` keepalive.
  - Concurrent stream limit per IP (`MAX_CONCURRENT_STREAMS_PER_IP = 2`) with slot acquire/release and 30-second stream timeout protection.
  - Client disconnect cancellation handling via `request.is_disconnected()`.
  - Parity preserved with existing non-streaming `POST /api/v1/check` endpoint.
  - Robust client SSE parser in `stream.ts` handling chunk boundaries and ping comments with Vitest coverage.
  - Frontend `App.tsx` live progressive updates: real-time per-card verdict rendering, live summary updates, Cancel button via `AbortController`, and automatic single fallback to standard verification if stream fails before claims arrive.
  - 54/54 backend pytest tests passing, 7/7 frontend Vitest tests passing, clean Vite build.

## Feature Pack Status
All 6 feature pack items (F6, F3, F5, F4, F1, F2) completed and verified across local backend and frontend suites.

## Glossary
- Claim: one atomic, checkable factual statement from the answer.
- Verdict: supported, uncertain or unsupported.
- Evidence: a retrieved title, URL and snippet used to judge a claim.
- Span: character range of a claim's quote in the original answer.

## Change log
- 2 Oct 2026: merged final document set. Frontend set to React + Vite.

## Three highest-risk fixes first
1. Secret exposure prevention across Git, Vercel, Render and client bundles.
2. Server-side security boundary: validation, CORS, rate limiting, production-safe errors, protected privileged routes.
3. Verification integrity: evidence provenance, schema validation, and resistance to prompt injection from retrieved content.
