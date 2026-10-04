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
- Phase 3 (Backend Vertical Slice) completed:
  - Claim extraction with verbatim quote location and character span calculation implemented (`claim_extractor.py`).
  - SearchProvider interface and Tavily adapter implemented with bounded timeouts and resilient error recovery (`search.py`).
  - Parallel per-claim verification with isolated error fallback implemented (`verifier.py`).
  - Full pipeline wired into `POST /api/v1/check` producing structured `CheckResponse` reports.
  - Rate limiting strictly verified: 5 req/min cap triggers HTTP 429 on the 6th rapid call.
  - Evaluation fixtures created (`eval_fixtures.json`) covering supported, mixed, unsupported, uncertain, and injection test cases.
  - Benchmark script created (`run_eval.py`) and verified against the 3,750-fact dataset (`ML MODEL DATASET/`).
  - 18/18 pytest test cases passing 100%.
- Pre-commit secret scanning hook active.

## Next implementation target
Phase 4: Frontend vertical slice. Build out interactive React components matching design tokens: input form with char counter, sample answer button, progress states, highlighted answer with colored span tags, summary strip, and claim cards with evidence drawer. Wire to backend. Commit as `feat: ui`.

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
