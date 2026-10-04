# TrustCheck PRD

## 0. Document status
- Status: MVP source of truth
- Event: offline hackathon, PPT due 2 Oct 2026 10:00 AM, live round 4 Oct 2026
- Primary domains: AI/ML (AI Reliability, Explainable AI), Cybersecurity, Developer Tooling
- Scope rule: small enough to build and stabilize before the live round

## 1. Product summary
TrustCheck is an AI answer reliability checker. A user pastes an AI-generated answer. TrustCheck splits it into atomic factual claims, retrieves evidence for each, evaluates each claim against that evidence, and returns a transparent result with three states:

- **Supported**: retrieved evidence directly supports the claim.
- **Uncertain**: evidence is incomplete, conflicting, outdated, ambiguous, or too weak for a firm judgment. This is the default when evidence is thin.
- **Unsupported**: the available evidence does not support the claim or materially contradicts it.

The demo value is not a single opaque score. It is the visible chain from answer to claims to searches to evidence to verdicts to reasoning.

## 2. Problem
AI answers often sound authoritative even when individual statements are weak, outdated, overgeneralized or fabricated. Users either trust the whole answer or fact-check all of it by hand. They need a fast way to see which parts deserve trust and why.

## 3. Target users
- Students checking AI study help before submitting work.
- Developers, researchers and journalists screening AI summaries.
- Teams that put AI-written text into reports.

Hackathon demo user: a person who pastes a mixed-quality AI answer and needs a claim-by-claim explanation in seconds.

## 4. Goals
1. Turn one pasted answer into a claim-level reliability report.
2. Make the pipeline explainable enough for a live demo.
3. Keep the MVP small enough to stabilize before the live round.
4. Keep frontend (React + Vite on Vercel) and backend (FastAPI on Render) independently deployable.
5. Make security constraints explicit so AI coding agents do not introduce avoidable vulnerabilities.
6. Return a typical report in under 20 seconds (up to 8 claims).

## 5. Non-goals for the hackathon
- User accounts, profiles, or saved history.
- Training or fine-tuning a model.
- Browser extension, file or PDF upload, URL mode.
- Fully autonomous fact checking without human-readable evidence.
- Perfect truth determination for subjective or value-based claims.
- Vector databases, agent swarms, multi-provider orchestration.
- Enterprise tenancy.

## 6. Core user flow
1. User lands on TrustCheck.
2. User pastes an AI answer, and optionally the original question.
3. User clicks **Check reliability**.
4. Frontend sends the request to the backend.
5. Backend extracts atomic claims and a focused search query for each.
6. Backend retrieves a small evidence set per claim.
7. Backend evaluates each claim against its evidence.
8. Backend returns structured verdicts with concise reasoning.
9. Frontend shows the highlighted answer and a claim-by-claim report.

## 7. Functional requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Plain-text input for the answer (max 4,000 characters) and optional question (max 500) | Must |
| FR2 | Extract up to 8 atomic, checkable claims | Must |
| FR3 | Retrieve evidence from web search for each claim | Must |
| FR4 | Verdict per claim: supported, uncertain or unsupported, with reasoning | Must |
| FR5 | Evidence shown comes only from the retrieval layer, never invented by the model | Must |
| FR6 | Highlighted answer plus claim list with verdict, reasoning and evidence | Must |
| FR7 | Summary counts per verdict | Must |
| FR8 | Progress state while checking | Should |
| FR9 | Built-in sample answer button for demos | Should |
| FR10 | Copy report as text | Could |

## 8. MVP acceptance criteria
### Input
- Supports pasted plain text. Rejects empty input. Enforces maximum size on the server.

### Claim extraction
- Produces numbered atomic claims with stable local IDs (`c1`, `c2`, ...).
- Does not turn headings, greetings or pure opinions into claims.
- Each claim carries the exact quote from the answer, used for highlighting.

### Evidence retrieval
- Generates a focused search query per claim.
- Returns title, URL, snippet and retrieval timestamp when available.
- Caps evidence per claim to keep latency and token use bounded.

### Verification
- Verdict is exactly `supported`, `uncertain` or `unsupported`.
- Verdict cites evidence IDs. `supported` requires at least one cited evidence item.
- Reasoning explains the verdict in plain language, 40 words or fewer.
- The system never invents a URL or quote.
- Missing evidence is never silently treated as support.

### UI
- Shows overall processing state and counts by verdict.
- Shows each claim with verdict, reasoning and evidence.
- Makes uncertainty visible. Handles API failure with a generic message and Retry.

### Security
- No secret in client JavaScript. No public or committed `.env`.
- Rate limit on the check endpoint. Input validation at the backend boundary.
- Generic error responses with no stack traces. Privileged operations stay server-side.

## 9. Non-functional requirements
- Reliability: one failed claim does not fail the whole report. It returns as `uncertain` with a clear reason.
- Cost control: per-IP rate limit and a global daily request cap.
- Accessibility: verdict never carried by color alone. Contrast meets WCAG AA.
- Performance: claims are checked in parallel.

## 10. Demo script (about 3 minutes)
1. Paste a prepared AI answer with correct, outdated and unsupported statements.
2. Click **Check reliability**, narrate the stages.
3. Show the claim decomposition and highlighted answer.
4. Open one supported claim and its source.
5. Open one uncertain claim and explain the evidence gap.
6. Open one unsupported claim and show the missing or conflicting evidence.
7. Close on the transparency principle: TrustCheck does not ask users to trust another black box. It exposes the verification chain.

## 11. Success criteria for the live demo
One mixed-quality answer visibly shows: answer, then 5 to 8 claims, then evidence for each, then mixed verdicts, then an explanation of why some claims are questionable. It is understandable without explaining the implementation first.

## 12. Risks and mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Search latency | Slow demo | Small query and evidence caps, parallel retrieval |
| LLM output drift | Broken JSON or UI | Strict schemas, validation, one retry maximum |
| Weak sources | Bad verdicts | Default to `uncertain` when evidence is thin |
| Hallucinated citations | Loss of trust | Display only URLs returned by the retrieval layer |
| Prompt injection via sources | Wrong verdicts | Treat all retrieved text as data, never instructions |
| Provider failure | Demo failure | Friendly failure state, one retry, prepared fallback |
| Render free service sleeping | Slow first request | Warm `/api/health` shortly before presenting |
| Cost abuse on a public endpoint | Surprise bill | Rate limit, input caps, daily cap |
| Scope creep | Unfinished demo | Follow task.md, cut non-MVP features first |

## 13. Future ideas, not MVP
Browser extension, URL and article mode, citation quality scoring, domain-specific modes (medical, legal), saved reports, team workspaces, human feedback loop.

## 14. Open questions
- Confirm search provider free-tier limits (default: Tavily).
- Confirm the PPT format organisers require.
