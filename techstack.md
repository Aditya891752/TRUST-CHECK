# TrustCheck Tech Stack

Pin exact versions at install time and commit lockfiles. Confirm free-tier limits for each service before the demo.

## 1. Chosen stack
| Layer | Choice | Why |
|-------|--------|-----|
| Frontend framework | React + Vite + TypeScript | Fast to build, static output, simple Vercel deploy |
| Styling | Tailwind CSS with custom tokens from design.md (or plain CSS with variables) | One spacing and color scale, no design-system lock-in |
| Components | Hand-written, restyled headless primitives only where needed | Avoids untouched Shadcn defaults |
| Fonts | IBM Plex Sans and IBM Plex Mono, self-hosted | Not Inter, no third-party font request |
| Icons | Small custom SVG set (under 8) | Avoids Lucide everywhere |
| Backend | Python + FastAPI + Uvicorn | Strong API contracts, async, easy orchestration |
| Validation | Pydantic v2 | Typed server-side boundaries |
| AI reasoning | Anthropic Claude API (official Python SDK) | Structured extraction and verification |
| Evidence search | Tavily Search API behind a `SearchProvider` interface | Fast LLM-oriented retrieval, swappable |
| Rate limiting | slowapi | Per-IP limits in FastAPI |
| HTTP client | httpx (async) | Search calls with timeouts |
| Languages | Python (backend), TypeScript and JavaScript (frontend), HTML and CSS (markup, styling), JSON (API contract) | One main language per layer |
| Editor | VS Code | One editor for both apps, built-in Git support |
| Source control | Git and GitHub, one monorepo | One place to connect both hosts |
| Hosting | Vercel (frontend) and Render (backend) | Clean split, Git-based deploys |
| Secret scanning | gitleaks as pre-commit hook and in CI | Keeps secrets out of Git history |
| Dependency audit | `pip-audit` and `npm audit` before demo | Catch known vulnerable packages |
| Testing | pytest (backend), Vitest (frontend utilities) | Minimal, targeted |
| Optional persistence | Supabase or Postgres | Only if a concrete need appears. Private, RLS mandatory |

## 2. Package guidance
### Frontend
React, TypeScript, Vite, Tailwind CSS (or CSS variables), Zod for response validation where useful, Vitest.

### Backend
FastAPI, Uvicorn, Pydantic v2, httpx, anthropic, slowapi, tenacity only if bounded retry needs it, pytest. Provider SDKs only where they save time without hiding the security boundary.

## 3. API principles
- Version routes under `/api/v1`.
- JSON in and JSON out. Stable schema names.
- Provider response shapes are normalized before a route returns them.
- No business logic in frontend components.

## 4. Dependency restraint
Every dependency must earn its place. Avoid unnecessary UI kits, decorative animation libraries, agent frameworks for a simple pipeline, databases without a concrete MVP need, and multiple AI providers unless one is needed for reliability.

## 5. Repo layout
```text
trustcheck/
  frontend/        (React + Vite app)
  backend/         (FastAPI service)
  docs/            (these documents)
  .gitignore
  .gitleaks.toml
  .env.example     (names only, empty values)
  README.md
```

## 6. Environment variables
Backend (Render dashboard only):
| Name | Purpose |
|------|---------|
| ANTHROPIC_API_KEY | Claude access |
| TAVILY_API_KEY | Search provider |
| ALLOWED_ORIGINS | Comma-separated frontend origins |
| ENV | `production` or `development` |
| RATE_LIMIT_PER_MINUTE | Per-IP cap |
| DAILY_REQUEST_CAP | Global cap |

Frontend (Vercel dashboard):
| Name | Purpose |
|------|---------|
| VITE_API_BASE_URL | Public base URL of the Render service. Not a secret |

Never put provider keys in any `VITE_*` variable. Everything with that prefix is bundled into the client and visible to every visitor.

## 7. Deployment contract
### Vercel
- Root directory: `frontend`. Framework preset: Vite.
- Build command: `npm run build`. Output directory: `dist`.
- Public configuration: only non-secret values.

### Render
- Root directory: `backend`. Runtime: Python.
- Build command: `pip install -r requirements.txt`.
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- Health check path: `/api/health`.
- Secrets in Render environment settings only. CORS limited to the deployed Vercel origin(s). Production mode with debug off.
